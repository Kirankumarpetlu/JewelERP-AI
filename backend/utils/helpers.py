from bson import ObjectId


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document _id from ObjectId to string."""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    if doc and "product_id" in doc:
        doc["product_id"] = str(doc["product_id"])
    if doc and "customer_id" in doc:
        doc["customer_id"] = str(doc["customer_id"])
    return doc


def serialize_docs(docs: list) -> list:
    """Convert list of MongoDB documents."""
    return [serialize_doc(d) for d in docs]


PURITY_FACTORS = {
    "24K": 1.0,
    "22K": 0.916,
    "18K": 0.75,
}


def get_purity_factor(purity: str) -> float:
    """Get multiplication factor for gold purity."""
    return PURITY_FACTORS.get(purity.upper(), 0.916)
