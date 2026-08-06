from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user, require_staff_or_admin

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


@router.post("/", response_model=schemas.BookingOut)
def create_booking(
    booking_in: schemas.BookingCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Khách hàng đặt chỗ trước qua mạng."""
    booking = models.Booking(customer_id=current_user.id, **booking_in.model_dump())
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/", response_model=List[schemas.BookingOut], dependencies=[Depends(require_staff_or_admin)])
def list_bookings(db: Session = Depends(get_db)):
    """Nhân viên xem toàn bộ danh sách đặt chỗ để sắp xếp máy."""
    return db.query(models.Booking).order_by(models.Booking.booking_time).all()


@router.get("/my-bookings", response_model=List[schemas.BookingOut])
def my_bookings(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return (
        db.query(models.Booking)
        .filter(models.Booking.customer_id == current_user.id)
        .order_by(models.Booking.booking_time)
        .all()
    )


@router.put("/{booking_id}", response_model=schemas.BookingOut, dependencies=[Depends(require_staff_or_admin)])
def update_booking(booking_id: int, booking_in: schemas.BookingUpdate, db: Session = Depends(get_db)):
    """Nhân viên xác nhận / gán máy / hủy đặt chỗ."""
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Không tìm thấy lượt đặt chỗ")
    for field, value in booking_in.model_dump(exclude_unset=True).items():
        setattr(booking, field, value)
    db.commit()
    db.refresh(booking)
    return booking
