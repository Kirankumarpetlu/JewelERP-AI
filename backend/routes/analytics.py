from fastapi import APIRouter
from services.analytics import (
    get_total_revenue,
    get_top_products,
    get_sales_trend,
    get_sales_by_type,
    get_top_customers,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/revenue")
async def revenue():
    """Total revenue with monthly breakdown."""
    return await get_total_revenue()


@router.get("/top-product")
async def top_product():
    """Most sold products."""
    products = await get_top_products(5)
    return {"top_products": products}


@router.get("/sales-trend")
async def sales_trend():
    """Time-series sales data."""
    trend = await get_sales_trend()
    return {"sales_trend": trend}


@router.get("/sales-by-type")
async def sales_by_type():
    """Sales distribution by product category."""
    data = await get_sales_by_type()
    return {"sales_by_type": data}


@router.get("/top-customers")
async def top_customers():
    """Top customers by spend."""
    customers = await get_top_customers(5)
    return {"top_customers": customers}
