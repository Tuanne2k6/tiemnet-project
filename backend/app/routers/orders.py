from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependencies import require_staff_or_admin

router = APIRouter(prefix="/api/orders", tags=["Orders (POS)"])


@router.post("/", response_model=schemas.OrderOut, dependencies=[Depends(require_staff_or_admin)])
def create_order(order_in: schemas.OrderCreate, db: Session = Depends(get_db)):
    """Tạo đơn hàng POS (bán nước/đồ ăn), có thể gắn với phiên chơi để gộp hóa đơn."""
    order = models.Order(session_id=order_in.session_id, customer_id=order_in.customer_id)
    total = 0.0
    for item in order_in.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy sản phẩm id={item.product_id}")
        if product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Sản phẩm '{product.name}' không đủ tồn kho")
        product.stock_quantity -= item.quantity
        order_item = models.OrderItem(
            product_id=product.id, quantity=item.quantity, unit_price=product.price
        )
        order.items.append(order_item)
        total += product.price * item.quantity

    order.total_amount = total
    order.status = models.OrderStatus.PAID
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/", response_model=List[schemas.OrderOut], dependencies=[Depends(require_staff_or_admin)])
def list_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).all()


@router.get("/{order_id}", response_model=schemas.OrderOut, dependencies=[Depends(require_staff_or_admin)])
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
    return order
