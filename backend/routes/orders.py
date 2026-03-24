from fastapi import APIRouter
from typing import Optional
from db.connection import get_db
from utils.helpers import serialize_doc

router = APIRouter(tags=["Orders"])


@router.get("/orders")
async def list_orders(status: Optional[str] = None, limit: int = 50, skip: int = 0):
    """List orders with optional status filter and pagination."""
    db = get_db()
    query = {}
    if status and status.lower() != "all":
        query["status"] = status

    total = await db.orders.count_documents(query)
    cursor = db.orders.find(query).sort("date", -1).skip(skip).limit(limit)

    orders = []
    async for order in cursor:
        order = serialize_doc(order)
        # Enrich with product and customer names
        product = await db.products.find_one({"_id": order.get("product_id")})
        customer = await db.customers.find_one({"_id": order.get("customer_id")})
        order["product_name"] = product["name"] if product else "Unknown"
        order["customer_name"] = customer["name"] if customer else "Unknown"
        order["date"] = order["date"].isoformat() if hasattr(order["date"], "isoformat") else str(order["date"])
        orders.append(order)

    return {"orders": orders, "total": total}
