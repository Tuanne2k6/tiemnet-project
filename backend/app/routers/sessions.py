import datetime as dt
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependencies import require_staff_or_admin, get_current_user

router = APIRouter(prefix="/api/sessions", tags=["Play Sessions"])


@router.post("/start", response_model=schemas.SessionOut, dependencies=[Depends(require_staff_or_admin)])
def start_session(session_in: schemas.SessionStart, db: Session = Depends(get_db)):
    """Nhân viên bấm 'Bắt đầu' khi khách ngồi vào máy."""
    computer = db.query(models.Computer).filter(models.Computer.id == session_in.computer_id).first()
    if not computer:
        raise HTTPException(status_code=404, detail="Không tìm thấy máy")
    if computer.status != models.ComputerStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Máy hiện không sẵn sàng để sử dụng")

    play_session = models.PlaySession(
        computer_id=computer.id,
        customer_id=session_in.customer_id,
        start_time=dt.datetime.utcnow(),
        status=models.SessionStatus.ACTIVE,
    )
    computer.status = models.ComputerStatus.IN_USE
    db.add(play_session)
    db.commit()
    db.refresh(play_session)
    return play_session


@router.post("/{session_id}/stop", response_model=schemas.SessionOut, dependencies=[Depends(require_staff_or_admin)])
def stop_session(session_id: int, db: Session = Depends(get_db)):
    """Kết thúc phiên chơi, tự động tính tiền theo bảng giá của máy."""
    play_session = db.query(models.PlaySession).filter(models.PlaySession.id == session_id).first()
    if not play_session:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên chơi")
    if play_session.status != models.SessionStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Phiên chơi đã kết thúc trước đó")

    computer = db.query(models.Computer).filter(models.Computer.id == play_session.computer_id).first()
    billing_plan = db.query(models.BillingPlan).filter(
        models.BillingPlan.id == computer.billing_plan_id
    ).first()

    play_session.end_time = dt.datetime.utcnow()
    duration_hours = (play_session.end_time - play_session.start_time).total_seconds() / 3600
    # Làm tròn lên theo mốc 15 phút để tránh thất thoát doanh thu
    billed_hours = max(0.25, round(duration_hours * 4) / 4)
    play_session.total_amount = round(billed_hours * billing_plan.price_per_hour, 0)
    play_session.status = models.SessionStatus.COMPLETED

    # Nếu phiên gắn với tài khoản khách hàng (không phải khách vãng lai) ->
    # tự động trừ vào số dư đã nạp trước đó (nghiệp vụ tài khoản trả trước)
    if play_session.customer_id:
        customer = db.query(models.User).filter(models.User.id == play_session.customer_id).first()
        if customer:
            customer.balance = (customer.balance or 0) - play_session.total_amount

    computer.status = models.ComputerStatus.AVAILABLE
    db.commit()
    db.refresh(play_session)
    return play_session


@router.get("/", response_model=List[schemas.SessionOut], dependencies=[Depends(require_staff_or_admin)])
def list_sessions(status: str = None, db: Session = Depends(get_db)):
    query = db.query(models.PlaySession)
    if status:
        query = query.filter(models.PlaySession.status == status)
    return query.order_by(models.PlaySession.start_time.desc()).all()


@router.get("/my-history", response_model=List[schemas.SessionOut])
def my_session_history(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Khách hàng xem lại lịch sử giờ chơi của chính mình."""
    return (
        db.query(models.PlaySession)
        .filter(models.PlaySession.customer_id == current_user.id)
        .order_by(models.PlaySession.start_time.desc())
        .all()
    )
