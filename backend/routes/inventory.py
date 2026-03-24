from fastapi import APIRouter, HTTPException
from typing import Optional
from db.connection import get_db
from models.schemas import CreateProductRequest, UpdateProductRequest
from utils.helpers import serialize_doc

router = APIRouter(tags=["Inventory"])

LOW_STOCK_THRESHOLD = 5


@router.get("/inventory")
async def list_inventory(category: Optional[str] = None, search: Optional[str] = None):
    """List all products with optional category filter and search."""
    db = get_db()
    query = {}
    if category and category.lower() != "all":
        query["category"] = {"$regex": category, "$options": "i"}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    cursor = db.products.find(query).sort("name", 1)
    products = []
    async for p in cursor:
        p = serialize_doc(p)
        p["low_stock"] = p.get("stock", 0) <= LOW_STOCK_THRESHOLD
        products.append(p)

    return {"products": products, "total": len(products)}


@router.post("/inventory")
async def add_product(req: CreateProductRequest):
    """Add a new product to inventory."""
    db = get_db()
    from bson import ObjectId
    product = {
        "_id": str(ObjectId()),
        "name": req.name,
        "category": req.category,
        "weight": req.weight,
        "purity": req.purity,
        "stock": req.stock,
        "price": req.price,
    }
    await db.products.insert_one(product)
    return {"message": "Product added", "product": serialize_doc(product)}


@router.put("/inventory/{product_id}")
async def update_product(product_id: str, req: UpdateProductRequest):
    """Update an existing product."""
    db = get_db()
    update_data = {k: v for k, v in req.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.products.update_one(
        {"_id": product_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")

    updated = await db.products.find_one({"_id": product_id})
    return {"message": "Product updated", "product": serialize_doc(updated)}


@router.delete("/inventory/{product_id}")
async def delete_product(product_id: str):
    """Delete a product from inventory."""
    db = get_db()
    result = await db.products.delete_one({"_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}
