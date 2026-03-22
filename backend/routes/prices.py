from fastapi import APIRouter
from services.metal_prices import fetch_metal_prices, get_price_history

router = APIRouter(tags=["Metal Prices"])


@router.get("/prices")
async def get_prices():
    """Get current gold and silver prices."""
    return await fetch_metal_prices()


@router.get("/prices/history")
async def get_prices_history(limit: int = 30):
    """Get historical metal prices."""
    history = await get_price_history(limit)
    return {"history": history}
