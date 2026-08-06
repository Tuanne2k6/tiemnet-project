"""
Models (bảng dữ liệu) cho Hệ Thống Quản Lý Tiệm Net.
"""
import enum
import datetime as dt
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, Text
)
from sqlalchemy.orm import relationship
from .database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"        # Chủ tiệm / quản trị toàn hệ thống
    STAFF = "staff"        # Nhân viên thu ngân
    CUSTOMER = "customer"  # Khách hàng / hội viên


class ComputerStatus(str, enum.Enum):
    AVAILABLE = "available"
    IN_USE = "in_use"
    MAINTENANCE = "maintenance"
    RESERVED = "reserved"


class SessionStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(120), nullable=True)
    phone = Column(String(20), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    balance = Column(Float, default=0.0)  # số dư tài khoản (nạp tiền trước)
    is_active = Column(Boolean, default=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)  # khóa tạm thời khi đăng nhập sai nhiều lần
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    sessions = relationship("PlaySession", back_populates="customer")
    bookings = relationship("Booking", back_populates="customer")
    orders = relationship("Order", back_populates="customer", foreign_keys="Order.customer_id")


class BillingPlan(Base):
    __tablename__ = "billing_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)          # VD: Giờ thường, Giờ VIP, Gói qua đêm
    price_per_hour = Column(Float, nullable=False)
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)

    computers = relationship("Computer", back_populates="billing_plan")


class Computer(Base):
    __tablename__ = "computers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)   # VD: PC01
    zone = Column(String(50), default="Thường")              # Thường / VIP
    status = Column(Enum(ComputerStatus), default=ComputerStatus.AVAILABLE)
    billing_plan_id = Column(Integer, ForeignKey("billing_plans.id"))

    billing_plan = relationship("BillingPlan", back_populates="computers")
    sessions = relationship("PlaySession", back_populates="computer")


class PlaySession(Base):
    """Một phiên sử dụng máy tính (chơi game / lướt web)."""
    __tablename__ = "play_sessions"

    id = Column(Integer, primary_key=True, index=True)
    computer_id = Column(Integer, ForeignKey("computers.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # null = khách vãng lai
    start_time = Column(DateTime, default=dt.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(Enum(SessionStatus), default=SessionStatus.ACTIVE)
    total_amount = Column(Float, default=0.0)

    computer = relationship("Computer", back_populates="sessions")
    customer = relationship("User", back_populates="sessions")


class Product(Base):
    """Sản phẩm bán tại quầy: nước uống, đồ ăn, thẻ giờ..."""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    category = Column(String(50), default="Đồ uống")
    price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    order_items = relationship("OrderItem", back_populates="product")


class Order(Base):
    """Đơn hàng POS (mua đồ ăn/nước, có thể gắn với phiên chơi)."""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("play_sessions.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nhân viên lập đơn
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    total_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    customer = relationship("User", back_populates="orders", foreign_keys=[customer_id])


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class Booking(Base):
    """Đặt chỗ trước qua mạng."""
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    computer_id = Column(Integer, ForeignKey("computers.id"), nullable=True)
    zone_preference = Column(String(50), nullable=True)
    booking_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    customer = relationship("User", back_populates="bookings")
    computer = relationship("Computer")
