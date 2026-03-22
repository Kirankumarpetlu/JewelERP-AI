"""
Metal price API integration service.
Fetches gold & silver rates from metalpriceapi.com with in-memory caching.
"""
import os
import httpx
from datetime import datetime, timedelta
from db.connection import get_db

METAL_API_KEY = os.getenv("METAL_PRICE_API_KEY", "")
METAL_API_URL = "https://api.metalpriceapi.com/v1/latest"

# In-memory cache
_cache = {
    "gold_rate": 6500.0,
    "silver_rate": 85.0,
    "last_updated": None,
    "expires_at": None,
}

CACHE_TTL = timedelta(minutes=5)


async def fetch_metal_prices() -> dict:
    """Fetch latest metal prices. Uses cache if fresh, else calls API."""
    now = datetime.now()

    # Return cache if still valid
    if _cache["expires_at"] and now < _cache["expires_at"]:
        return {
            "gold_rate": _cache["gold_rate"],
            "silver_rate": _cache["silver_rate"],
            "last_updated": _cache["last_updated"].isoformat() if _cache["last_updated"] else now.isoformat(),
        }

    # Try external API
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                METAL_API_URL,
                params={
                    "api_key": METAL_API_KEY,
                    "base": "INR",
                    "currencies": "XAU,XAG",
                }
            )
            data = resp.json()

            if data.get("success"):
                rates = data.get("rates", {})
                # API returns INR per troy ounce — convert to per gram
                # 1 troy ounce = 31.1035 grams
                gold_per_oz = rates.get("INRXAU", 0)
                silver_per_oz = rates.get("INRXAG", 0)

                if gold_per_oz > 0:
                    gold_per_gram = round(1 / gold_per_oz * 31.1035, 2) if gold_per_oz else 6500
                else:
                    gold_per_gram = _cache["gold_rate"]

                if silver_per_oz > 0:
                    silver_per_gram = round(1 / silver_per_oz * 31.1035, 2) if silver_per_oz else 85
                else:
                    silver_per_gram = _cache["silver_rate"]

                # Update cache
                _cache["gold_rate"] = gold_per_gram
                _cache["silver_rate"] = silver_per_gram
                _cache["last_updated"] = now
                _cache["expires_at"] = now + CACHE_TTL

                # Store in DB
                db = get_db()
                if db is not None:
                    await db.metal_prices.insert_one({
                        "date": now,
                        "gold_rate": gold_per_gram,
                        "silver_rate": silver_per_gram,
                    })

    except Exception as e:
        print(f"[WARN] Metal price API error: {e}")
        # Try to load from DB
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
    """Get just the latest gold rate."""
    prices = await fetch_metal_prices()
    return prices["gold_rate"]


async def get_price_history(limit=30) -> list:
    """Get historical metal prices from DB."""
    db = get_db()
    cursor = db.metal_prices.find().sort("date", -1).limit(limit)
    history = []
    async for doc in cursor:
        history.append({
            "date": doc["date"].isoformat() if hasattr(doc["date"], "isoformat") else str(doc["date"]),
            "gold_rate": doc["gold_rate"],
            "silver_rate": doc["silver_rate"],
        })
    return list(reversed(history))
