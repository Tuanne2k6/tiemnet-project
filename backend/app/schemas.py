"""
Pydantic Schemas - định dạng dữ liệu vào/ra cho API (RESTful).
"""
import re
import datetime as dt
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from .models import UserRole, ComputerStatus, SessionStatus, OrderStatus, BookingStatus


# ---------- User ----------
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None


def _validate_password_strength(v: str) -> str:
    """
    Chính sách mật khẩu mạnh (OWASP Authentication Cheat Sheet):
    - Tối thiểu 8 ký tự
    - Có ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số
    """
    if len(v) < 8:
        raise ValueError("Mật khẩu phải có ít nhất 8 ký tự")
    if not re.search(r"[A-Z]", v):
        raise ValueError("Mật khẩu phải chứa ít nhất 1 chữ hoa")
    if not re.search(r"[a-z]", v):
        raise ValueError("Mật khẩu phải chứa ít nhất 1 chữ thường")
    if not re.search(r"\d", v):
        raise ValueError("Mật khẩu phải chứa ít nhất 1 chữ số")
    return v


class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.CUSTOMER

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        return _validate_password_strength(v)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    role: UserRole
    balance: float
    is_active: bool
    created_at: dt.datetime


# ---------- Auth ----------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, v: str) -> str:
        return _validate_password_strength(v)


class TopUpRequest(BaseModel):
    amount: float
    note: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def validate_amount_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Số tiền nạp phải lớn hơn 0")
        return v


# ---------- Billing Plan ----------
class BillingPlanBase(BaseModel):
    name: str
    price_per_hour: float
    description: Optional[str] = None


class BillingPlanCreate(BillingPlanBase):
    pass


class BillingPlanOut(BillingPlanBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_active: bool


# ---------- Computer ----------
class ComputerBase(BaseModel):
    code: str
    zone: str = "Thường"
    billing_plan_id: int


class ComputerCreate(ComputerBase):
    pass


class ComputerUpdate(BaseModel):
    zone: Optional[str] = None
    status: Optional[ComputerStatus] = None
    billing_plan_id: Optional[int] = None


class ComputerOut(ComputerBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: ComputerStatus


# ---------- Play Session ----------
class SessionStart(BaseModel):
    computer_id: int
    customer_id: Optional[int] = None


class SessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    computer_id: int
    customer_id: Optional[int]
    start_time: dt.datetime
    end_time: Optional[dt.datetime]
    status: SessionStatus
    total_amount: float


# ---------- Product ----------
class ProductBase(BaseModel):
    name: str
    category: str = "Đồ uống"
    price: float
    stock_quantity: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    is_active: Optional[bool] = None


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_active: bool


# ---------- Order ----------
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = 1


class OrderCreate(BaseModel):
    session_id: Optional[int] = None
    customer_id: Optional[int] = None
    items: List[OrderItemCreate]


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    quantity: int
    unit_price: float


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    session_id: Optional[int]
    customer_id: Optional[int]
    status: OrderStatus
    total_amount: float
    created_at: dt.datetime
    items: List[OrderItemOut] = []


# ---------- Booking ----------
class BookingCreate(BaseModel):
    computer_id: Optional[int] = None
    zone_preference: Optional[str] = None
    booking_time: dt.datetime
    duration_minutes: int = 60
    note: Optional[str] = None


class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    computer_id: Optional[int] = None


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_id: int
    computer_id: Optional[int]
    zone_preference: Optional[str]
    booking_time: dt.datetime
    duration_minutes: int
    status: BookingStatus
    note: Optional[str]


# ---------- Reports ----------
class RevenueReportOut(BaseModel):
    from_date: dt.date
    to_date: dt.date
    total_session_revenue: float
    total_product_revenue: float
    total_revenue: float
    total_sessions: int
    total_orders: int
