from datetime import date
from typing import Optional

from fastapi import APIRouter

from services.metal_prices import fetch_metal_prices, get_multi_year_price_history, get_price_history

router = APIRouter(tags=["Metal Prices"])


@router.get("/prices")
async def get_prices():
    """Get current gold and silver prices."""
    return await fetch_metal_prices()


@router.get("/prices/history")
async def get_prices_history(
    limit: int = 30,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    interval: str = "daily",
):
    """Get historical metal prices."""
    history = await get_price_history(limit=limit, start_date=start_date, end_date=end_date, interval=interval)
    return {"history": history}


@router.get("/prices/history/current-year")
async def get_current_year_prices_history():
    """Get monthly gold and silver prices from January of the current year to today."""
    history = await get_multi_year_price_history(date.today().year)
    return {"history": history}


@router.get("/prices/history/2025-onward")
async def get_2025_onward_prices_history():
    """Get monthly gold and silver prices from January 2025 to today."""
    history = await get_multi_year_price_history(2025)
    return {"history": history}
