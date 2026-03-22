from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ───────────────────── Customer ─────────────────────
class CustomerOut(BaseModel):
    id: str = Field(alias="_id")
    name: str
    phone: str
    total_spent: float = 0
    order_count: int = 0
    loyalty: str = "Silver"
    created_at: datetime = None

    class Config:
        populate_by_name = True


# ───────────────────── Product ─────────────────────
class ProductOut(BaseModel):
    id: str = Field(alias="_id")
    name: str
    category: str
    weight: float
    purity: str
    stock: int
    price: float

    class Config:
        populate_by_name = True


class CreateProductRequest(BaseModel):
    name: str
    category: str
    weight: float
    purity: str = "22K"
    stock: int = 10
    price: float = 0


class UpdateProductRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    weight: Optional[float] = None
    purity: Optional[str] = None
    stock: Optional[int] = None
    price: Optional[float] = None


# ───────────────────── Order ─────────────────────
class OrderOut(BaseModel):
    id: str = Field(alias="_id")
    product_id: str
    customer_id: str
    product_name: Optional[str] = None
    customer_name: Optional[str] = None
    weight: float
    gold_rate: float
    making_charge: float
    total_price: float
    status: str = "Completed"
    date: datetime

    class Config:
        populate_by_name = True


# ───────────────────── Billing ─────────────────────
class CreateBillRequest(BaseModel):
    product: str
    weight: float
    purity: str = "22K"
    making_charge: float = 12.0
    customer_name: Optional[str] = "Walk-in Customer"
    customer_phone: Optional[str] = ""


class BillResponse(BaseModel):
    order_id: str
    product: str
    weight: float
    purity: str
    purity_factor: float
    gold_rate: float
    gold_value: float
    making_charge_percent: float
    making_charge_amount: float
    subtotal: float
    gst_percent: float = 3.0
    gst_amount: float
    total_price: float
    date: str


# ───────────────────── Metal Prices ─────────────────────
class MetalPriceOut(BaseModel):
    gold_rate: float
    silver_rate: float
    last_updated: str


# ───────────────────── Chat ─────────────────────
class ChatRequest(BaseModel):
    query: str


class ChatResponse(BaseModel):
    response: str


# ───────────────────── AI Insights ─────────────────────
class InsightItem(BaseModel):
    type: str  # "warning", "trend", "prediction", "recommendation"
    title: str
    description: str
    icon: str = "Lightbulb"
    color: str = "amber"


class AIInsightsResponse(BaseModel):
    insights: List[InsightItem]


# ───────────────────── Dashboard ─────────────────────
class DashboardStats(BaseModel):
    total_revenue: float
    total_orders: int
    total_customers: int
    gold_rate: float
    silver_rate: float
    revenue_trend: list
    orders_trend: list
    gold_price_trend: list
    silver_price_trend: list
    top_selling: list
    low_stock: list
    recent_transactions: list
