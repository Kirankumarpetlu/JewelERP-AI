"""
JewelVault ERP -- FastAPI Backend
AI-powered jewellery shop management system.
"""
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from db.connection import connect_to_mongo, close_mongo_connection, get_db
from utils.seed_data import seed_database
from ml.demand_prediction import train_demand_model

# Import routers
from routes.prices import router as prices_router
from routes.billing import router as billing_router
from routes.inventory import router as inventory_router
from routes.orders import router as orders_router
from routes.customers import router as customers_router
from routes.analytics import router as analytics_router
from routes.dashboard import router as dashboard_router
from routes.ai_insights import router as ai_insights_router
from routes.chat import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    print("[START] Starting JewelVault ERP Backend...")
    await connect_to_mongo()

    db = get_db()
    await seed_database(db)
    await train_demand_model()

    print("[READY] Backend ready!")
    yield
    await close_mongo_connection()


app = FastAPI(
    title="JewelVault ERP API",
    description="AI-powered Jewellery ERP backend with Groq LLM, analytics, and real-time metal pricing",
    version="1.0.0",
    lifespan=lifespan,
)

# --------- CORS ---------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- Routers ---------
app.include_router(prices_router)
app.include_router(billing_router)
app.include_router(inventory_router)
app.include_router(orders_router)
app.include_router(customers_router)
app.include_router(analytics_router)
app.include_router(dashboard_router)
app.include_router(ai_insights_router)
app.include_router(chat_router)


# --------- Health Check ---------
@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "app": "JewelVault ERP API",
        "version": "1.0.0",
    }


@app.get("/api/status", tags=["Health"])
async def api_status():
    db = get_db()
    order_count = await db.orders.count_documents({}) if db else 0
    product_count = await db.products.count_documents({}) if db else 0
    customer_count = await db.customers.count_documents({}) if db else 0
    return {
        "status": "running",
        "database": "connected" if db else "disconnected",
        "collections": {
            "orders": order_count,
            "products": product_count,
            "customers": customer_count,
        }
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
