from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependencies import require_admin, require_staff_or_admin

router = APIRouter(prefix="/api/computers", tags=["Computers"])


@router.get("/", response_model=List[schemas.ComputerOut])
def list_computers(db: Session = Depends(get_db)):
    """Xem trạng thái toàn bộ máy (dùng cho sơ đồ phòng máy realtime)."""
    return db.query(models.Computer).all()


@router.post("/", response_model=schemas.ComputerOut, dependencies=[Depends(require_admin)])
def create_computer(computer_in: schemas.ComputerCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Computer).filter(models.Computer.code == computer_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mã máy đã tồn tại")
    computer = models.Computer(**computer_in.model_dump())
    db.add(computer)
    db.commit()
    db.refresh(computer)
    return computer


@router.put("/{computer_id}", response_model=schemas.ComputerOut, dependencies=[Depends(require_staff_or_admin)])
def update_computer(computer_id: int, computer_in: schemas.ComputerUpdate, db: Session = Depends(get_db)):
    computer = db.query(models.Computer).filter(models.Computer.id == computer_id).first()
    if not computer:
        raise HTTPException(status_code=404, detail="Không tìm thấy máy")
    for field, value in computer_in.model_dump(exclude_unset=True).items():
        setattr(computer, field, value)
    db.commit()
    db.refresh(computer)
    return computer


@router.delete("/{computer_id}", dependencies=[Depends(require_admin)])
def delete_computer(computer_id: int, db: Session = Depends(get_db)):
    computer = db.query(models.Computer).filter(models.Computer.id == computer_id).first()
    if not computer:
        raise HTTPException(status_code=404, detail="Không tìm thấy máy")
    db.delete(computer)
    db.commit()
    return {"message": "Đã xóa máy"}
