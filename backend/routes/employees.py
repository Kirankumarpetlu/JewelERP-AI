from typing import Dict

from fastapi import APIRouter, HTTPException
from starlette.concurrency import run_in_threadpool

from models.schemas import (
    AttendanceActionResponse,
    EmployeeCreateRequest,
    EmployeeInsightResponse,
    EmployeeUpdateRequest,
    PerformanceResponse,
)
from services.employee_management import (
    check_in_employee,
    check_out_employee,
    create_employee,
    delete_employee,
    get_employee,
    get_employee_insights,
    get_employee_performance,
    list_employees,
    update_employee,
)

router = APIRouter(prefix="/employees", tags=["Employees"])


async def _run_employee_task(func, *args):
    try:
        return await run_in_threadpool(func, *args)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("")
async def create_employee_endpoint(payload: EmployeeCreateRequest):
    employee = await _run_employee_task(create_employee, payload.model_dump())
    return {"employee": employee}


@router.get("")
async def list_employees_endpoint():
    employees = await _run_employee_task(list_employees)
    return {"employees": employees, "total": len(employees)}


@router.get("/insights", response_model=EmployeeInsightResponse)
async def employee_insights_endpoint():
    insights = await _run_employee_task(get_employee_insights)
    return {"insights": insights}


@router.get("/{employee_id}")
async def get_employee_endpoint(employee_id: str):
    employee = await _run_employee_task(get_employee, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"employee": employee}


@router.put("/{employee_id}")
async def update_employee_endpoint(employee_id: str, payload: EmployeeUpdateRequest):
    update_payload: Dict = {key: value for key, value in payload.model_dump().items() if value is not None}
    employee = await _run_employee_task(update_employee, employee_id, update_payload)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"employee": employee}


@router.delete("/{employee_id}")
async def delete_employee_endpoint(employee_id: str):
    deleted = await _run_employee_task(delete_employee, employee_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted successfully"}


@router.post("/{employee_id}/attendance/check-in", response_model=AttendanceActionResponse)
async def check_in_employee_endpoint(employee_id: str):
    attendance = await _run_employee_task(check_in_employee, employee_id)
    if not attendance:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Check-in saved", "attendance": attendance}


@router.post("/{employee_id}/attendance/check-out", response_model=AttendanceActionResponse)
async def check_out_employee_endpoint(employee_id: str):
    attendance = await _run_employee_task(check_out_employee, employee_id)
    if not attendance:
        raise HTTPException(status_code=404, detail="No open attendance record found for today")
    return {"message": "Check-out saved", "attendance": attendance}


@router.get("/{employee_id}/performance", response_model=PerformanceResponse)
async def employee_performance_endpoint(employee_id: str):
    performance = await _run_employee_task(get_employee_performance, employee_id)
    if not performance:
        raise HTTPException(status_code=404, detail="Employee not found")
    return performance
