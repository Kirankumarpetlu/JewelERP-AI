from fastapi import APIRouter
from db.connection import get_db
from utils.helpers import serialize_doc

router = APIRouter(tags=["Customers"])


@router.get("/customers")
async def list_customers():
    """List all customers with order stats and loyalty tier."""
    db = get_db()
    cursor = db.customers.find().sort("total_spent", -1)

    customers = []
    async for c in cursor:
        c = serialize_doc(c)
        # Count orders
        order_count = await db.orders.count_documents({"customer_id": c["_id"]})
        total_spent = c.get("total_spent", 0)

        # Loyalty tier
        loyalty = "Gold" if total_spent >= 500000 else "Silver"

        # Last order date
        last_order = await db.orders.find_one(
            {"customer_id": c["_id"]},
            sort=[("date", -1)]
        )

        customers.append({
            "_id": c["_id"],
            "name": c["name"],
            "phone": c.get("phone", ""),
            "purchases": order_count,
            "total_spent": round(total_spent, 2),
            "loyalty": loyalty,
            "avatar": "".join([w[0].upper() for w in c["name"].split()[:2]]),
            "last_visit": last_order["date"].isoformat() if last_order and hasattr(last_order["date"], "isoformat") else "N/A",
        })

    return {"customers": customers, "total": len(customers)}
