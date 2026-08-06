"""
Hệ Thống Quản Lý Tiệm Net - Backend API
Xây dựng bằng FastAPI + SQLAlchemy + MySQL, tuân theo kiến trúc phân lớp
(routers -> schemas -> models -> database) tương tự Clean Architecture đơn giản hóa.
"""
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from .database import Base, engine, SessionLocal
from .limiter import limiter
from .routers import auth, users, computers, sessions, billing, products, orders, bookings, reports
from .seed_data import run_seed

# Tạo bảng nếu chưa tồn tại (dùng Alembic migration khi lên production)
Base.metadata.create_all(bind=engine)

# Tự động tạo dữ liệu mẫu nếu database còn trống — bỏ qua khi chạy pytest
# (TESTING=1) để không ảnh hưởng logic bootstrap tài khoản đầu tiên trong test.
if os.getenv("TESTING") != "1":
    _seed_db = SessionLocal()
    try:
        run_seed(_seed_db)
    finally:
        _seed_db.close()

app = FastAPI(
    title="Hệ Thống Quản Lý Tiệm Net API",
    description="API phục vụ website quản lý tiệm net: quản lý máy, giờ chơi, POS, đặt chỗ, báo cáo doanh thu.",
    version="1.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS: giới hạn domain được phép gọi API, đọc từ biến môi trường (phân tách bằng dấu phẩy)
# Ví dụ production: CORS_ORIGINS=https://tiemnet.vercel.app,https://www.tiemnet.com
_cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
CORS_ORIGINS = [origin.strip() for origin in _cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(computers.router)
app.include_router(sessions.router)
app.include_router(billing.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(bookings.router)
app.include_router(reports.router)


@app.get("/", tags=["Health Check"])
def health_check():
    return {"status": "ok", "message": "Tiem Net Management API đang hoạt động"}
