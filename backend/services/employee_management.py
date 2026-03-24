from datetime import datetime
from typing import Any, Dict, List, Optional

from services.firestore_admin import get_firestore_admin

EMPLOYEES_COLLECTION = "employees"
ATTENDANCE_COLLECTION = "attendance"
ORDERS_COLLECTION = "orders"


def _serialize_doc(snapshot) -> Dict[str, Any]:
    payload = snapshot.to_dict() or {}
    payload["id"] = snapshot.id
    return payload


def _rating_for(achievement_percentage: float) -> str:
    if achievement_percentage > 100:
        return "Excellent"
    if achievement_percentage >= 70:
        return "Good"
    return "Needs Improvement"


def create_employee(payload: Dict[str, Any]) -> Dict[str, Any]:
    db = get_firestore_admin()
    created_at = datetime.utcnow()
    employee_ref = db.collection(EMPLOYEES_COLLECTION).document()
    employee = {
        "name": payload["name"],
        "role": payload["role"],
        "phone": payload["phone"],
        "joining_date": payload["joining_date"],
        "salary": float(payload["salary"]),
        "target_sales": float(payload["target_sales"]),
        "total_sales": float(payload.get("total_sales", 0)),
        "total_hours_worked": float(payload.get("total_hours_worked", 0)),
        "created_at": created_at,
    }
    employee_ref.set(employee)
    employee["id"] = employee_ref.id
    return employee


def list_employees() -> List[Dict[str, Any]]:
    db = get_firestore_admin()
    docs = db.collection(EMPLOYEES_COLLECTION).stream()
    return sorted((_serialize_doc(doc) for doc in docs), key=lambda item: item.get("name", ""))


def get_employee(employee_id: str) -> Optional[Dict[str, Any]]:
    db = get_firestore_admin()
    snapshot = db.collection(EMPLOYEES_COLLECTION).document(employee_id).get()
    if not snapshot.exists:
        return None
    return _serialize_doc(snapshot)


def update_employee(employee_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    db = get_firestore_admin()
    ref = db.collection(EMPLOYEES_COLLECTION).document(employee_id)
    snapshot = ref.get()
    if not snapshot.exists:
        return None
    ref.set(payload, merge=True)
    return _serialize_doc(ref.get())


def delete_employee(employee_id: str) -> bool:
    db = get_firestore_admin()
    ref = db.collection(EMPLOYEES_COLLECTION).document(employee_id)
    if not ref.get().exists:
        return False
    ref.delete()
    return True


def check_in_employee(employee_id: str) -> Optional[Dict[str, Any]]:
    db = get_firestore_admin()
    employee_ref = db.collection(EMPLOYEES_COLLECTION).document(employee_id)
    if not employee_ref.get().exists:
        return None

    now = datetime.utcnow()
    date_key = now.strftime("%Y-%m-%d")
    attendance_ref = db.collection(ATTENDANCE_COLLECTION).document()
    attendance = {
        "employee_id": employee_id,
        "date": date_key,
        "check_in_time": now,
        "check_out_time": None,
        "total_hours": 0,
    }
    attendance_ref.set(attendance)
    attendance["id"] = attendance_ref.id
    return attendance


def check_out_employee(employee_id: str) -> Optional[Dict[str, Any]]:
    db = get_firestore_admin()
    today_key = datetime.utcnow().strftime("%Y-%m-%d")
    attendance_docs = list(
        db.collection(ATTENDANCE_COLLECTION)
        .where("employee_id", "==", employee_id)
        .where("date", "==", today_key)
        .stream()
    )

    open_record = None
    for snapshot in attendance_docs:
        payload = snapshot.to_dict() or {}
        if not payload.get("check_out_time"):
            open_record = snapshot
            break

    if open_record is None:
        return None

    payload = open_record.to_dict() or {}
    check_in_time = payload["check_in_time"]
    check_out_time = datetime.utcnow()
    total_hours = round((check_out_time - check_in_time).total_seconds() / 3600, 2)

    open_record.reference.update({
        "check_out_time": check_out_time,
        "total_hours": total_hours,
    })

    employee_ref = db.collection(EMPLOYEES_COLLECTION).document(employee_id)
    employee_snapshot = employee_ref.get()
    if employee_snapshot.exists:
        employee_payload = employee_snapshot.to_dict() or {}
        employee_ref.update({
            "total_hours_worked": float(employee_payload.get("total_hours_worked", 0)) + total_hours,
        })

    updated = open_record.reference.get().to_dict() or {}
    updated["id"] = open_record.id
    return updated


def get_employee_performance(employee_id: str) -> Optional[Dict[str, Any]]:
    db = get_firestore_admin()
    employee_snapshot = db.collection(EMPLOYEES_COLLECTION).document(employee_id).get()
    if not employee_snapshot.exists:
        return None

    employee = employee_snapshot.to_dict() or {}
    employee_name = employee.get("name", "Employee")
    target_sales = float(employee.get("target_sales", 0))

    order_docs = list(db.collection(ORDERS_COLLECTION).where("employee_id", "==", employee_id).stream())
    attendance_docs = list(db.collection(ATTENDANCE_COLLECTION).where("employee_id", "==", employee_id).stream())

    total_sales = round(sum(float((doc.to_dict() or {}).get("total_price", 0)) for doc in order_docs), 2)
    total_orders = len(order_docs)
    total_customers = len({(doc.to_dict() or {}).get("customer_id", "") for doc in order_docs if (doc.to_dict() or {}).get("customer_id", "")})
    total_hours = round(sum(float((doc.to_dict() or {}).get("total_hours", 0)) for doc in attendance_docs), 2)
    achievement_percentage = round((total_customers / target_sales) * 100, 2) if target_sales else 0

    return {
        "employee_name": employee_name,
        "total_sales": total_sales,
        "target_sales": target_sales,
        "achievement_percentage": achievement_percentage,
        "total_orders": total_orders,
        "total_hours": total_hours,
        "performance_rating": _rating_for(achievement_percentage),
    }


def get_employee_insights() -> List[str]:
    insights: List[str] = []
    for employee in list_employees():
        performance = get_employee_performance(employee["id"])
        if not performance:
            continue
        achievement = performance["achievement_percentage"]
        if achievement > 100:
            insights.append(f"Employee {performance['employee_name']} exceeded target by {round(achievement - 100, 1)}%.")
        elif achievement < 70:
            insights.append(f"{performance['employee_name']} has low conversion rate and needs coaching.")
    return insights[:6]
