from fastapi import APIRouter, HTTPException
from datetime import datetime
from bson import ObjectId
from db.connection import get_db
from models.schemas import CreateBillRequest, BillResponse
from services.firestore_admin import is_firestore_admin_ready, get_firestore_admin
from services.metal_prices import get_latest_gold_rate
from utils.helpers import get_purity_factor

router = APIRouter(tags=["Billing"])


@router.post("/create-bill")
async def create_bill(req: CreateBillRequest):
    """Create a new bill / invoice."""
    db = get_db()

    # Get current gold rate
    gold_rate = await get_latest_gold_rate()
    purity_factor = get_purity_factor(req.purity)

    # Calculate
    gold_value = round(req.weight * gold_rate * purity_factor, 2)
    making_amount = round(gold_value * (req.making_charge / 100), 2)
    subtotal = round(gold_value + making_amount, 2)
    gst_percent = 3.0
    gst_amount = round(subtotal * (gst_percent / 100), 2)
    total_price = round(subtotal + gst_amount, 2)

    # Find or create customer
    customer = None
    if req.customer_name and req.customer_name != "Walk-in Customer":
        customer = await db.customers.find_one({"name": req.customer_name})

    if not customer:
        customer_id = str(ObjectId())
        await db.customers.insert_one({
            "_id": customer_id,
            "name": req.customer_name or "Walk-in Customer",
            "phone": req.customer_phone or "",
            "total_spent": total_price,
            "created_at": datetime.now(),
        })
    else:
        customer_id = customer["_id"]
        await db.customers.update_one(
            {"_id": customer_id},
            {"$inc": {"total_spent": total_price}}
        )

    # Find a matching product to reduce stock
    product = await db.products.find_one({
        "category": {"$regex": req.product, "$options": "i"}
    })
    product_id = product["_id"] if product else str(ObjectId())

    if product and product.get("stock", 0) > 0:
        await db.products.update_one(
            {"_id": product["_id"]},
            {"$inc": {"stock": -1}}
        )

    # Create order
    order_id = str(ObjectId())
    order = {
        "_id": order_id,
        "product_id": product_id,
        "customer_id": customer_id,
        "employee_id": req.employee_id or "",
        "weight": req.weight,
        "gold_rate": gold_rate,
        "making_charge": req.making_charge,
        "total_price": total_price,
        "status": "Completed",
        "date": datetime.now(),
    }
    await db.orders.insert_one(order)

    if req.employee_id and is_firestore_admin_ready():
        firestore_db = get_firestore_admin()
        employee_ref = firestore_db.collection("employees").document(req.employee_id)
        employee_snapshot = employee_ref.get()
        if employee_snapshot.exists:
            employee_data = employee_snapshot.to_dict() or {}
            employee_ref.set({
                "total_sales": float(employee_data.get("total_sales", 0)) + total_price,
            }, merge=True)

    return {
        "order_id": order_id,
        "product": req.product,
        "weight": req.weight,
        "purity": req.purity,
        "purity_factor": purity_factor,
        "gold_rate": gold_rate,
        "gold_value": gold_value,
        "making_charge_percent": req.making_charge,
        "making_charge_amount": making_amount,
        "subtotal": subtotal,
        "gst_percent": gst_percent,
        "gst_amount": gst_amount,
        "total_price": total_price,
        "date": datetime.now().isoformat(),
    }
