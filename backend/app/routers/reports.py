import datetime as dt
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models, schemas
from ..database import get_db
from ..dependencies import require_staff_or_admin

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/revenue", response_model=schemas.RevenueReportOut, dependencies=[Depends(require_staff_or_admin)])
def revenue_report(
    from_date: dt.date = Query(..., description="Từ ngày, VD: 2026-07-01"),
    to_date: dt.date = Query(..., description="Đến ngày, VD: 2026-07-30"),
    db: Session = Depends(get_db),
):
    """Báo cáo doanh thu tổng hợp: giờ chơi + bán hàng POS, theo khoảng thời gian."""
    start_dt = dt.datetime.combine(from_date, dt.time.min)
    end_dt = dt.datetime.combine(to_date, dt.time.max)

    session_total, session_count = db.query(
        func.coalesce(func.sum(models.PlaySession.total_amount), 0.0),
        func.count(models.PlaySession.id),
    ).filter(
        models.PlaySession.status == models.SessionStatus.COMPLETED,
        models.PlaySession.end_time >= start_dt,
        models.PlaySession.end_time <= end_dt,
    ).first()

    order_total, order_count = db.query(
        func.coalesce(func.sum(models.Order.total_amount), 0.0),
        func.count(models.Order.id),
    ).filter(
        models.Order.status == models.OrderStatus.PAID,
        models.Order.created_at >= start_dt,
        models.Order.created_at <= end_dt,
    ).first()

    return schemas.RevenueReportOut(
        from_date=from_date,
        to_date=to_date,
        total_session_revenue=session_total,
        total_product_revenue=order_total,
        total_revenue=session_total + order_total,
        total_sessions=session_count,
        total_orders=order_count,
    )


@router.get("/computer-usage", dependencies=[Depends(require_staff_or_admin)])
def computer_usage_report(db: Session = Depends(get_db)):
    """Thống kê mức độ sử dụng của từng máy (tổng số phiên, tổng doanh thu)."""
    rows = (
        db.query(
            models.Computer.code,
            func.count(models.PlaySession.id).label("total_sessions"),
            func.coalesce(func.sum(models.PlaySession.total_amount), 0.0).label("total_revenue"),
        )
        .outerjoin(models.PlaySession, models.PlaySession.computer_id == models.Computer.id)
        .group_by(models.Computer.id)
        .all()
    )
    return [
        {"computer_code": r.code, "total_sessions": r.total_sessions, "total_revenue": r.total_revenue}
        for r in rows
    ]
