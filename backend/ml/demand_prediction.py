"""
Simple ML-based demand prediction using order history.
Uses scikit-learn LinearRegression on weekly order aggregates.
"""
import numpy as np
from datetime import datetime, timedelta
from db.connection import get_db

# In-memory model cache
_model_cache = {
    "predictions": {},
    "trained_at": None,
}


async def train_demand_model():
    """Train demand prediction model from MongoDB order data."""
    db = get_db()
    if db is None:
        return

    # Skip complex aggregation if using Mongomock
    from db.connection import client
    if client and client.__class__.__name__ == 'AsyncMongoMockClient':
        print("[ML] Skipping ML training on Mock MongoDB due to aggregation limits. Using static mock predictions.")
        _model_cache["predictions"] = {
            "Ring": {"predicted_next_week": 42, "trend": "increasing", "avg_weekly": 35.2},
            "Chain": {"predicted_next_week": 15, "trend": "stable", "avg_weekly": 14.8},
            "Necklace": {"predicted_next_week": 8, "trend": "increasing", "avg_weekly": 6.1},
            "Bangle": {"predicted_next_week": 28, "trend": "increasing", "avg_weekly": 20.0},
            "Earring": {"predicted_next_week": 5, "trend": "decreasing", "avg_weekly": 8.5},
            "Bracelet": {"predicted_next_week": 12, "trend": "stable", "avg_weekly": 11.2},
        }
        from datetime import datetime
        _model_cache["trained_at"] = datetime.now().isoformat()
        return

    try:
        from sklearn.linear_model import LinearRegression

        now = datetime.now()
        # Get weekly order counts by category over last 3 months
        three_months_ago = now - timedelta(days=90)

        pipeline = [
            {"$match": {"date": {"$gte": three_months_ago}, "status": {"$ne": "Refunded"}}},
            {"$lookup": {
                "from": "products",
                "localField": "product_id",
                "foreignField": "_id",
                "as": "product",
            }},
            {"$unwind": {"path": "$product", "preserveNullAndEmptyArrays": True}},
            {"$group": {
                "_id": {
                    "week": {"$week": "$date"},
                    "category": "$product.category",
                },
                "count": {"$sum": 1},
                "revenue": {"$sum": "$total_price"},
            }},
            {"$sort": {"_id.week": 1}},
        ]

        results = await db.orders.aggregate(pipeline).to_list(500)

        # Group by category
        category_data = {}
        for r in results:
            cat = r["_id"].get("category", "Unknown")
            if cat not in category_data:
                category_data[cat] = []
            category_data[cat].append({
                "week": r["_id"]["week"],
                "count": r["count"],
                "revenue": r["revenue"],
            })

        predictions = {}
        for cat, data in category_data.items():
            if len(data) < 3:
                continue

            weeks = np.array([d["week"] for d in data]).reshape(-1, 1)
            counts = np.array([d["count"] for d in data])

            model = LinearRegression()
            model.fit(weeks, counts)

            # Predict next week
            current_week = now.isocalendar()[1]
            next_week = current_week + 1
            predicted = max(0, round(model.predict([[next_week]])[0]))

            # Trend
            if len(counts) >= 2:
                recent_avg = np.mean(counts[-3:])
                older_avg = np.mean(counts[:-3]) if len(counts) > 3 else counts[0]
                trend = "increasing" if recent_avg > older_avg * 1.1 else (
                    "decreasing" if recent_avg < older_avg * 0.9 else "stable"
                )
            else:
                trend = "stable"

            predictions[cat] = {
                "predicted_next_week": predicted,
                "trend": trend,
                "avg_weekly": round(float(np.mean(counts)), 1),
            }

        _model_cache["predictions"] = predictions
        _model_cache["trained_at"] = now.isoformat()
        print(f"[ML] Model trained -- predictions for {len(predictions)} categories")

    except Exception as e:
        print(f"[WARN] ML training error: {e}")
        _model_cache["predictions"] = {}


def get_predictions() -> dict:
    """Get cached predictions."""
    return _model_cache
