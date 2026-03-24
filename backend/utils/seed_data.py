"""
Synthetic data generator for Jewellery ERP.
Generates 120 customers, 55 products, and 1200+ orders.
"""
import random
from datetime import datetime, timedelta
from bson import ObjectId

# ─────────────── Indian Names ───────────────
FIRST_NAMES = [
    "Priya", "Raj", "Anita", "Vikram", "Meena", "Arjun", "Sneha", "Deepak",
    "Kavita", "Suresh", "Pooja", "Ramesh", "Nisha", "Anil", "Sunita",
    "Rohit", "Divya", "Manoj", "Asha", "Sanjay", "Rekha", "Amit",
    "Geeta", "Vijay", "Pallavi", "Kiran", "Sapna", "Ravi", "Lata", "Ajay",
    "Neha", "Praveen", "Swati", "Nitin", "Seema", "Rahul", "Jyoti", "Prakash",
    "Usha", "Ankur", "Manju", "Harsh", "Poonam", "Gaurav", "Rina", "Tushar",
    "Shalini", "Dev", "Komal", "Varun"
]

LAST_NAMES = [
    "Sharma", "Patel", "Singh", "Mehta", "Iyer", "Reddy", "Gupta", "Kumar",
    "Verma", "Joshi", "Desai", "Nair", "Agarwal", "Chopra", "Malhotra",
    "Bhat", "Rao", "Das", "Mishra", "Chauhan", "Pillai", "Saxena",
    "Kapoor", "Bhatt", "Tiwari", "Kulkarni", "Shah", "Menon", "Bansal", "Pandey"
]

PRODUCT_TYPES = {
    "Ring": {"weight_range": (2, 12), "emojis": "💍"},
    "Chain": {"weight_range": (5, 25), "emojis": "⛓️"},
    "Necklace": {"weight_range": (15, 50), "emojis": "📿"},
    "Bangle": {"weight_range": (8, 20), "emojis": "⭕"},
    "Earring": {"weight_range": (2, 8), "emojis": "✨"},
    "Bracelet": {"weight_range": (5, 15), "emojis": "🔗"},
}

PURITIES = ["22K", "24K", "18K"]
PURITY_FACTORS = {"24K": 1.0, "22K": 0.916, "18K": 0.75}

ADJECTIVES = [
    "Classic", "Antique", "Modern", "Traditional", "Royal", "Diamond-studded",
    "Kundan", "Temple", "Filigree", "Pearl", "Ruby", "Emerald",
    "Designer", "Bridal", "Lightweight", "Heavy", "Polished", "Matte",
]


def generate_customers(n=120):
    """Generate n synthetic customers."""
    customers = []
    used = set()
    for _ in range(n):
        while True:
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            name = f"{first} {last}"
            if name not in used:
                used.add(name)
                break
        phone = f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}"
        customers.append({
            "_id": str(ObjectId()),
            "name": name,
            "phone": phone,
            "total_spent": 0,
            "created_at": datetime.now() - timedelta(days=random.randint(30, 365)),
        })
    return customers


def generate_products(n=55):
    """Generate n synthetic products."""
    products = []
    used_names = set()
    for _ in range(n):
        category = random.choice(list(PRODUCT_TYPES.keys()))
        purity = random.choice(PURITIES)
        adj = random.choice(ADJECTIVES)
        name = f"{adj} {purity} Gold {category}"

        # Deduplicate
        while name in used_names:
            adj = random.choice(ADJECTIVES)
            name = f"{adj} {purity} Gold {category}"
        used_names.add(name)

        w_min, w_max = PRODUCT_TYPES[category]["weight_range"]
        weight = round(random.uniform(w_min, w_max), 1)
        gold_rate = random.uniform(5500, 7000)
        price = round(weight * gold_rate * PURITY_FACTORS[purity], 0)

        products.append({
            "_id": str(ObjectId()),
            "name": name,
            "category": category,
            "weight": weight,
            "purity": purity,
            "stock": random.randint(1, 50),
            "price": price,
        })
    return products


def generate_orders(customers, products, n=1200):
    """Generate n synthetic orders over last 12 months."""
    orders = []
    now = datetime.now()
    for _ in range(n):
        customer = random.choice(customers)
        product = random.choice(products)
        gold_rate = round(random.uniform(5500, 7000), 2)
        weight = round(random.uniform(2, 50), 1)
        making_charge = round(random.uniform(5, 20), 1)
        purity_factor = PURITY_FACTORS.get(product["purity"], 0.916)
        total_price = round(weight * gold_rate * purity_factor * (1 + making_charge / 100), 2)

        order_date = now - timedelta(days=random.randint(0, 365))

        statuses = ["Completed"] * 85 + ["Processing"] * 10 + ["Refunded"] * 5
        status = random.choice(statuses)

        orders.append({
            "_id": str(ObjectId()),
            "product_id": product["_id"],
            "customer_id": customer["_id"],
            "weight": weight,
            "gold_rate": gold_rate,
            "making_charge": making_charge,
            "total_price": total_price,
            "status": status,
            "date": order_date,
        })
    return orders


async def seed_database(db):
    """Seed DB with synthetic data if collections are empty."""
    order_count = await db.orders.count_documents({})
    if order_count > 0:
        print(f"[SKIP] Database already has {order_count} orders. Skipping seed.")
        return

    print("[SEED] Seeding database with synthetic data...")

    customers = generate_customers(120)
    products = generate_products(55)
    orders = generate_orders(customers, products, 1200)

    # Calculate total_spent per customer
    spent_map = {}
    for order in orders:
        if order["status"] != "Refunded":
            cid = order["customer_id"]
            spent_map[cid] = spent_map.get(cid, 0) + order["total_price"]
    for c in customers:
        c["total_spent"] = round(spent_map.get(c["_id"], 0), 2)

    await db.customers.insert_many(customers)
    await db.products.insert_many(products)
    await db.orders.insert_many(orders)

    print(f"  [OK] {len(customers)} customers")
    print(f"  [OK] {len(products)} products")
    print(f"  [OK] {len(orders)} orders")
    print("[SEED] Seeding complete!")
