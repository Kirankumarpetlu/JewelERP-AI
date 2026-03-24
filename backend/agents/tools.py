"""
LangChain tools for the Jewellery ERP AI assistant.
Each tool wraps a business function so the LLM can call it via tool-use.
"""
import asyncio
from langchain_core.tools import tool
from services.analytics import (
    get_today_sales_data,
    get_this_week_top_product,
    get_low_stock_products,
    get_top_products,
    get_total_revenue,
    get_sales_by_type,
)
from services.metal_prices import fetch_metal_prices
from ml.demand_prediction import get_predictions
from db.connection import get_db


def _run_async(coro):
    """Run async coroutine from sync context."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            future = pool.submit(asyncio.run, coro)
            return future.result(timeout=30)
    else:
        return asyncio.run(coro)


@tool
def get_today_sales() -> str:
    """Get today's total sales count and revenue. Use when asked about today's sales, today's revenue, or daily performance."""
    data = _run_async(get_today_sales_data())
    return (
        f"Today's Sales: {data['orders']} orders totaling ₹{data['revenue']:,.2f}"
    )


@tool
def get_top_product() -> str:
    """Get the top selling product this week. Use when asked about best sellers, most popular items, or trending products."""
    data = _run_async(get_this_week_top_product())
    return (
        f"Top product this week: {data['name']} ({data['category']}) — "
        f"{data['sold']} units sold, ₹{data['revenue']:,.2f} revenue"
    )


@tool
def get_inventory_status() -> str:
    """Get current inventory status including low stock alerts. Use when asked about stock levels, inventory, or restocking needs."""
    low_stock = _run_async(get_low_stock_products(5))
    db = get_db()
    total = _run_async(db.products.count_documents({}))

    lines = [f"Total products in inventory: {total}"]
    if low_stock:
        lines.append(f"\n⚠️ Low stock items ({len(low_stock)}):")
        for item in low_stock:
            lines.append(f"  - {item['name']}: {item['stock']} units left")
    else:
        lines.append("All items are well-stocked.")
    return "\n".join(lines)


@tool
def get_gold_price() -> str:
    """Get current gold and silver prices. Use when asked about gold rate, silver rate, metal prices, or current rates."""
    prices = _run_async(fetch_metal_prices())
    return (
        f"Current Metal Prices:\n"
        f"  Gold: ₹{prices['gold_rate']:,.2f} per gram\n"
        f"  Silver: ₹{prices['silver_rate']:,.2f} per gram\n"
        f"  Last updated: {prices['last_updated']}"
    )


@tool
def get_revenue_summary() -> str:
    """Get overall revenue and monthly breakdown. Use when asked about total revenue, monthly sales, or business performance."""
    data = _run_async(get_total_revenue())
    summary = [f"Total Revenue: ₹{data['total_revenue']:,.2f}"]
    summary.append(f"Total Orders: {data['total_orders']}")
    if data.get("monthly"):
        summary.append("\nMonthly breakdown (last 6 months):")
        for m in data["monthly"][-6:]:
            summary.append(f"  {m['month']}: ₹{m['revenue']:,.0f} ({m['orders']} orders)")
    return "\n".join(summary)


@tool
def get_sales_distribution() -> str:
    """Get sales distribution by product category. Use when asked about category-wise sales, which category sells most, or product mix."""
    data = _run_async(get_sales_by_type())
    lines = ["Sales by Product Category:"]
    total = sum(d["value"] for d in data)
    for d in data:
        pct = round((d["value"] / total) * 100) if total > 0 else 0
        lines.append(f"  {d['name']}: {d['value']} orders ({pct}%) — ₹{d['revenue']:,.0f}")
    return "\n".join(lines)


@tool
def get_ai_business_insights() -> str:
    """Get AI-generated business insights and demand predictions. Use when asked about predictions, forecasts, recommendations, or AI analysis."""
    ml_data = get_predictions()
    predictions = ml_data.get("predictions", {})

    lines = ["AI Business Insights:"]
    if predictions:
        for cat, pred in predictions.items():
            trend_emoji = "📈" if pred["trend"] == "increasing" else "📉" if pred["trend"] == "decreasing" else "➡️"
            lines.append(
                f"  {trend_emoji} {cat}: {pred['trend']} trend, "
                f"~{pred['predicted_next_week']} orders predicted next week "
                f"(avg: {pred['avg_weekly']}/week)"
            )
    else:
        lines.append("  ML predictions not yet available.")

    # Low stock alerts
    low_stock = _run_async(get_low_stock_products(5))
    if low_stock:
        lines.append("\n⚠️ Restock recommendations:")
        for item in low_stock[:3]:
            lines.append(f"  - {item['name']}: only {item['stock']} units left")

    return "\n".join(lines)


# Export all tools
ALL_TOOLS = [
    get_today_sales,
    get_top_product,
    get_inventory_status,
    get_gold_price,
    get_revenue_summary,
    get_sales_distribution,
    get_ai_business_insights,
]
