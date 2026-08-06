from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependencies import require_admin, require_staff_or_admin

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/", response_model=List[schemas.UserOut], dependencies=[Depends(require_staff_or_admin)])
def list_users(
    role: Optional[models.UserRole] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Danh sách khách hàng/nhân viên (chỉ Admin & Staff). Có thể lọc theo vai trò."""
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    return query.offset(skip).limit(limit).all()


@router.get("/{user_id}", response_model=schemas.UserOut, dependencies=[Depends(require_staff_or_admin)])
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    return user


@router.put("/{user_id}", response_model=schemas.UserOut, dependencies=[Depends(require_admin)])
def update_user(user_id: int, user_in: schemas.UserUpdate, db: Session = Depends(get_db)):
    """Chỉ Admin được cập nhật vai trò / khóa tài khoản."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    for field, value in user_in.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", dependencies=[Depends(require_admin)])
def deactivate_user(user_id: int, db: Session = Depends(get_db)):
    """Vô hiệu hóa tài khoản thay vì xóa cứng (giữ lịch sử giao dịch)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    user.is_active = False
    db.commit()
    return {"message": "Đã vô hiệu hóa tài khoản"}


@router.post(
    "/{user_id}/topup",
    response_model=schemas.UserOut,
    dependencies=[Depends(require_staff_or_admin)],
)
def top_up_balance(user_id: int, payload: schemas.TopUpRequest, db: Session = Depends(get_db)):
    """
    Nạp tiền vào tài khoản khách hàng (nghiệp vụ 'nạp tiền để có thời gian chơi').
    Chỉ Admin/Nhân viên được thực hiện, thường dùng khi khách nạp tiền mặt tại quầy.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    if user.role != models.UserRole.CUSTOMER:
        raise HTTPException(status_code=400, detail="Chỉ nạp tiền được cho tài khoản khách hàng")

    user.balance = (user.balance or 0) + payload.amount
    db.commit()
    db.refresh(user)
    return user
