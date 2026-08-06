from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependencies import require_admin

router = APIRouter(prefix="/api/billing-plans", tags=["Billing Plans"])


@router.get("/", response_model=List[schemas.BillingPlanOut])
def list_billing_plans(db: Session = Depends(get_db)):
    """Danh sách bảng giá (giờ thường, giờ VIP, gói qua đêm...)."""
    return db.query(models.BillingPlan).filter(models.BillingPlan.is_active == True).all()  # noqa: E712


@router.post("/", response_model=schemas.BillingPlanOut, dependencies=[Depends(require_admin)])
def create_billing_plan(plan_in: schemas.BillingPlanCreate, db: Session = Depends(get_db)):
    plan = models.BillingPlan(**plan_in.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}", dependencies=[Depends(require_admin)])
def deactivate_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(models.BillingPlan).filter(models.BillingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Không tìm thấy bảng giá")
    plan.is_active = False
    db.commit()
    return {"message": "Đã ngừng sử dụng bảng giá"}
