"""
Metal price integration service.
Fetches live and historical gold and silver rates from MetalpriceAPI.
"""
import os
import asyncio
from collections import OrderedDict
from calendar import monthrange
from datetime import date, datetime, time, timedelta

import httpx

from config import load_app_env
from db.connection import get_db

load_app_env()

METAL_API_KEY = os.getenv("METAL_PRICE_API_KEY", "")
METAL_API_URL = "https://api.metalpriceapi.com/v1/latest"
METAL_TIMEFRAME_URL = "https://api.metalpriceapi.com/v1/timeframe"
METAL_HISTORICAL_URL = "https://api.metalpriceapi.com/v1/{snapshot_date}"
TROY_OUNCE_GRAMS = 31.1034768

_cache = {
    "gold_rate": 6500.0,
    "silver_rate": 85.0,
    "last_updated": None,
    "expires_at": None,
}

CACHE_TTL = timedelta(minutes=5)


def _extract_price_per_gram(rates: dict, metal_code: str, fallback: float) -> float:
    direct_key = f"INR{metal_code}"
    direct_rate = rates.get(direct_key)
    if direct_rate:
        return round(float(direct_rate) / TROY_OUNCE_GRAMS, 2)

    inverse_rate = rates.get(metal_code)
    if inverse_rate:
        return round((1 / float(inverse_rate)) / TROY_OUNCE_GRAMS, 2)

    return fallback


async def _store_price_point(point_date: date, gold_rate: float, silver_rate: float) -> None:
    db = get_db()
    if db is None:
        return

    timestamp = datetime.combine(point_date, time.min)
    await db.metal_prices.update_one(
        {"date": timestamp},
        {
            "$set": {
                "date": timestamp,
                "gold_rate": gold_rate,
                "silver_rate": silver_rate,
            }
        },
        upsert=True,
    )


async def fetch_metal_prices() -> dict:
    """Fetch latest gold and silver prices in INR per gram."""
    now = datetime.now()

    if _cache["expires_at"] and now < _cache["expires_at"]:
        return {
            "gold_rate": _cache["gold_rate"],
            "silver_rate": _cache["silver_rate"],
            "last_updated": _cache["last_updated"].isoformat() if _cache["last_updated"] else now.isoformat(),
        }

    try:
        if not METAL_API_KEY:
            raise RuntimeError("METAL_PRICE_API_KEY is not configured.")

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                METAL_API_URL,
                headers={"X-API-KEY": METAL_API_KEY},
                params={
                    "base": "INR",
                    "currencies": "XAU,XAG",
                },
            )
            response.raise_for_status()
            data = response.json()

        if not data.get("success"):
            raise RuntimeError(data.get("error", {}).get("info", "Metal price request failed."))

        rates = data.get("rates", {})
        gold_per_gram = _extract_price_per_gram(rates, "XAU", _cache["gold_rate"])
        silver_per_gram = _extract_price_per_gram(rates, "XAG", _cache["silver_rate"])

        _cache["gold_rate"] = gold_per_gram
        _cache["silver_rate"] = silver_per_gram
        _cache["last_updated"] = now
        _cache["expires_at"] = now + CACHE_TTL

        await _store_price_point(now.date(), gold_per_gram, silver_per_gram)
    except Exception as exc:
        print(f"[WARN] Metal price API error: {exc}")
        db = get_db()
        if db is not None:
            latest = await db.metal_prices.find_one(sort=[("date", -1)])
            if latest:
                _cache["gold_rate"] = latest["gold_rate"]
                _cache["silver_rate"] = latest["silver_rate"]
                _cache["last_updated"] = latest["date"]
                _cache["expires_at"] = now + CACHE_TTL

    return {
        "gold_rate": _cache["gold_rate"],
        "silver_rate": _cache["silver_rate"],
        "last_updated": (_cache["last_updated"] or now).isoformat(),
    }


async def get_latest_gold_rate() -> float:
    prices = await fetch_metal_prices()
    return prices["gold_rate"]


async def _fetch_single_metal_timeframe(client: httpx.AsyncClient, start_date: date, end_date: date, metal_code: str) -> dict:
    response = await client.get(
        METAL_TIMEFRAME_URL,
        headers={"X-API-KEY": METAL_API_KEY},
        params={
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "base": "INR",
            "currencies": metal_code,
        },
    )
    response.raise_for_status()
    payload = response.json()
    if not payload.get("success"):
        raise RuntimeError(payload.get("error", {}).get("message", f"{metal_code} history request failed."))
    return payload.get("rates", {})


async def _fetch_historical_snapshot(snapshot_date: date) -> dict:
    if not METAL_API_KEY:
        raise RuntimeError("METAL_PRICE_API_KEY is not configured.")

    async with httpx.AsyncClient(timeout=20) as client:
        gold_response, silver_response = await asyncio.gather(
            client.get(
                METAL_HISTORICAL_URL.format(snapshot_date=snapshot_date.isoformat()),
                headers={"X-API-KEY": METAL_API_KEY},
                params={"base": "INR", "currencies": "XAU"},
            ),
            client.get(
                METAL_HISTORICAL_URL.format(snapshot_date=snapshot_date.isoformat()),
                headers={"X-API-KEY": METAL_API_KEY},
                params={"base": "INR", "currencies": "XAG"},
            ),
        )
        gold_response.raise_for_status()
        silver_response.raise_for_status()

    gold_payload = gold_response.json()
    silver_payload = silver_response.json()

    if not gold_payload.get("success"):
        raise RuntimeError(gold_payload.get("error", {}).get("message", f"Gold historical snapshot request failed for {snapshot_date}."))
    if not silver_payload.get("success"):
        raise RuntimeError(silver_payload.get("error", {}).get("message", f"Silver historical snapshot request failed for {snapshot_date}."))

    gold_rate = _extract_price_per_gram(gold_payload.get("rates", {}), "XAU", _cache["gold_rate"])
    silver_rate = _extract_price_per_gram(silver_payload.get("rates", {}), "XAG", _cache["silver_rate"])
    await _store_price_point(snapshot_date, gold_rate, silver_rate)

    return {
        "date": snapshot_date.isoformat(),
        "month": snapshot_date.strftime("%b"),
        "gold_rate": gold_rate,
        "silver_rate": silver_rate,
    }


async def _fetch_timeframe_history(start_date: date, end_date: date) -> list:
    if not METAL_API_KEY:
        raise RuntimeError("METAL_PRICE_API_KEY is not configured.")

    async with httpx.AsyncClient(timeout=20) as client:
        gold_rates, silver_rates = await asyncio.gather(
            _fetch_single_metal_timeframe(client, start_date, end_date, "XAU"),
            _fetch_single_metal_timeframe(client, start_date, end_date, "XAG"),
        )

    history = []
    for day in sorted(set(gold_rates.keys()) | set(silver_rates.keys())):
        gold_rate = _extract_price_per_gram(gold_rates.get(day, {}), "XAU", _cache["gold_rate"])
        silver_rate = _extract_price_per_gram(silver_rates.get(day, {}), "XAG", _cache["silver_rate"])
        history.append(
            {
                "date": day,
                "month": datetime.fromisoformat(day).strftime("%b"),
                "gold_rate": gold_rate,
                "silver_rate": silver_rate,
            }
        )
        await _store_price_point(datetime.fromisoformat(day).date(), gold_rate, silver_rate)

    return history


def _aggregate_monthly_history(price_points: list) -> list:
    monthly_points: OrderedDict[str, dict] = OrderedDict()
    for point in price_points:
        monthly_points[point["date"][:7]] = point
    return list(monthly_points.values())


async def _get_db_history(limit: int = 30) -> list:
    db = get_db()
    if db is None:
        return []

    cursor = db.metal_prices.find().sort("date", -1).limit(limit)
    history = []
    async for doc in cursor:
        history.append(
            {
                "date": doc["date"].isoformat() if hasattr(doc["date"], "isoformat") else str(doc["date"]),
                "month": doc["date"].strftime("%b") if hasattr(doc["date"], "strftime") else str(doc["date"])[:7],
                "gold_rate": doc["gold_rate"],
                "silver_rate": doc["silver_rate"],
            }
        )
    return list(reversed(history))


async def get_price_history(limit: int = 30, start_date: date | None = None, end_date: date | None = None, interval: str = "daily") -> list:
    """Get price history from the API for a date range, else from the local DB cache."""
    if start_date and end_date:
        try:
            history = await _fetch_timeframe_history(start_date, end_date)
            return _aggregate_monthly_history(history) if interval == "monthly" else history
        except Exception as exc:
            print(f"[WARN] Metal timeframe API error: {exc}")

    history = await _get_db_history(limit)
    if interval == "monthly":
        return _aggregate_monthly_history(history)
    return history


async def get_multi_year_price_history(start_year: int = 2025) -> list:
    today = date.today()
    history = []
    for year in range(start_year, today.year + 1):
        last_month = today.month if year == today.year else 12
        for month in range(1, last_month + 1):
            if year == today.year and month == today.month:
                latest = await fetch_metal_prices()
                history.append(
                    {
                        "date": today.isoformat(),
                        "month": today.strftime("%b"),
                        "gold_rate": latest["gold_rate"],
                        "silver_rate": latest["silver_rate"],
                    }
                )
                continue

            snapshot_date = date(year, month, monthrange(year, month)[1])
            try:
                history.append(await _fetch_historical_snapshot(snapshot_date))
            except Exception as exc:
                print(f"[WARN] Historical snapshot error for {snapshot_date}: {exc}")

    return history
