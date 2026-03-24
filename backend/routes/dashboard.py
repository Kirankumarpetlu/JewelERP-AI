from fastapi import APIRouter
from services.analytics import (
    get_total_revenue,
    get_top_products,
    get_sales_trend,
    get_low_stock_products,
    get_recent_transactions,
)
from services.metal_prices import fetch_metal_prices, get_multi_year_price_history
from db.connection import get_db

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard")
async def dashboard():
    """Aggregated dashboard data — stats, trends, alerts, transactions."""
    db = get_db()

    # Parallel data fetches
    revenue_data = await get_total_revenue()
    prices = await fetch_metal_prices()
    top_products = await get_top_products(4)
    low_stock = await get_low_stock_products(5)
    recent_tx = await get_recent_transactions(5)
    sales_trend = await get_sales_trend()
    metal_history = await get_multi_year_price_history(2025)

    # Customer count
    customer_count = await db.customers.count_documents({})

    # Build revenue & orders trend arrays
    revenue_trend = [{"month": s["month"], "revenue": s["revenue"]} for s in sales_trend]
    orders_trend = [{"month": s["month"], "orders": s["orders"]} for s in sales_trend]
    gold_price_trend = [{"month": point["month"], "price": point["gold_rate"], "date": point["date"]} for point in metal_history]
    silver_price_trend = [{"month": point["month"], "price": point["silver_rate"], "date": point["date"]} for point in metal_history]

    return {
        "total_revenue": revenue_data["total_revenue"],
        "total_orders": revenue_data["total_orders"],
        "total_customers": customer_count,
        "gold_rate": prices["gold_rate"],
        "silver_rate": prices["silver_rate"],
        "revenue_trend": revenue_trend,
        "orders_trend": orders_trend,
        "gold_price_trend": gold_price_trend,
        "silver_price_trend": silver_price_trend,
        "top_selling": top_products,
        "low_stock": low_stock,
        "recent_transactions": recent_tx,
    }
