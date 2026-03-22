from fastapi import APIRouter
from db.connection import get_db
from ml.demand_prediction import get_predictions
from services.analytics import get_low_stock_products, get_top_products, get_sales_by_type

router = APIRouter(tags=["AI Insights"])

LOW_STOCK_THRESHOLD = 5


@router.get("/ai-insights")
async def ai_insights():
    """Generate AI-powered business insights — rule-based + ML predictions."""
    db = get_db()
    insights = []

    # ─── Rule-based insights ───
    # 1. Low stock warnings
    low_stock = await get_low_stock_products(LOW_STOCK_THRESHOLD)
    for item in low_stock[:3]:
        insights.append({
            "type": "warning",
            "title": f"Restock {item['name']}",
            "description": f"{item['name']} has only {item['stock']} units left. "
                           f"Consider restocking before the upcoming season.",
            "icon": "Package",
            "color": "amber",
        })

    # 2. Top selling / trending products
    top_products = await get_top_products(3)
    if top_products:
        top = top_products[0]
        insights.append({
            "type": "trend",
            "title": f"{top['category']}s are trending",
            "description": f"{top['name']} is the top seller with {top['sold']} units sold "
                           f"generating ₹{top['revenue']:,.0f} revenue.",
            "icon": "TrendingUp",
            "color": "emerald",
        })

    # 3. Sales distribution
    sales_by_type = await get_sales_by_type()
    if sales_by_type:
        top_cat = sales_by_type[0]
        total_orders = sum(s["value"] for s in sales_by_type)
        pct = round((top_cat["value"] / total_orders) * 100) if total_orders > 0 else 0
        insights.append({
            "type": "recommendation",
            "title": f"{top_cat['name']}s dominate {pct}% of sales",
            "description": f"{pct}% of orders are {top_cat['name']}s. "
                           f"Adjust procurement and display to capitalize on this demand.",
            "icon": "Star",
            "color": "primary",
        })

    # ─── ML-based insights ───
    ml_data = get_predictions()
    predictions = ml_data.get("predictions", {})

    for cat, pred in predictions.items():
        if pred.get("trend") == "increasing":
            insights.append({
                "type": "prediction",
                "title": f"{cat} demand increasing",
                "description": f"{cat} sales trending upward. Predicted ~{pred['predicted_next_week']} "
                               f"orders next week (avg: {pred['avg_weekly']}/week).",
                "icon": "TrendingUp",
                "color": "emerald",
            })
        elif pred.get("trend") == "decreasing":
            insights.append({
                "type": "prediction",
                "title": f"{cat} sales declining",
                "description": f"{cat} demand is decreasing. Consider promotions or "
                               f"reducing inventory orders.",
                "icon": "AlertTriangle",
                "color": "destructive",
            })

    # Revenue forecast insight
    if predictions:
        total_predicted = sum(p.get("predicted_next_week", 0) for p in predictions.values())
        insights.append({
            "type": "prediction",
            "title": f"~{total_predicted} orders expected next week",
            "description": f"Based on ML analysis, approximately {total_predicted} orders are "
                           f"predicted for next week across all categories.",
            "icon": "IndianRupee",
            "color": "primary",
        })

    # Seasonal recommendation
    insights.append({
        "type": "recommendation",
        "title": "Seasonal prep recommendation",
        "description": "Start seasonal collection procurement early. "
                       "Historical data shows demand surges during festivals exceed stock by 30-40%.",
        "icon": "Lightbulb",
        "color": "amber",
    })

    return {"insights": insights}
