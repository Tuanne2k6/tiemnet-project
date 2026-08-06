"""
Seed Data — tự động tạo dữ liệu mẫu khi database còn trống (lần chạy đầu tiên).
Giúp có ngay dữ liệu để demo/test mà không cần tạo tay từng cái qua Swagger.

Chỉ chạy khi bảng `users` chưa có bản ghi nào — chạy lại nhiều lần không bị
tạo trùng dữ liệu.
"""
import datetime as dt
from sqlalchemy.orm import Session

from . import models
from .auth import hash_password


def run_seed(db: Session) -> None:
    if db.query(models.User).count() > 0:
        return  # Đã có dữ liệu -> không seed lại

    print("[seed] Database trống — đang tạo dữ liệu mẫu ban đầu...")

    # ---------- Tài khoản mẫu ----------
    admin = models.User(
        username="admin", email="admin@tiemnetcafe.vn", full_name="Quản trị viên",
        phone="0900000001", hashed_password=hash_password("Admin@123"),
        role=models.UserRole.ADMIN,
    )
    staff = models.User(
        username="nhanvien1", email="nhanvien1@tiemnetcafe.vn", full_name="Nguyễn Văn Nhân Viên",
        phone="0900000002", hashed_password=hash_password("NhanVien@123"),
        role=models.UserRole.STAFF,
    )
    customer1 = models.User(
        username="khach1", email="khach1@tiemnetcafe.vn", full_name="Trần Văn Khách",
        phone="0900000003", hashed_password=hash_password("KhachHang@123"),
        role=models.UserRole.CUSTOMER, balance=50000,
    )
    customer2 = models.User(
        username="khach2", email="khach2@tiemnetcafe.vn", full_name="Lê Thị Khách",
        phone="0900000004", hashed_password=hash_password("KhachHang@123"),
        role=models.UserRole.CUSTOMER, balance=20000,
    )
    db.add_all([admin, staff, customer1, customer2])
    db.commit()

    # ---------- Bảng giá ----------
    plan_thuong = models.BillingPlan(name="Giờ thường", price_per_hour=6000, description="Áp dụng khu vực Thường")
    plan_vip = models.BillingPlan(name="Giờ VIP", price_per_hour=10000, description="Áp dụng khu vực VIP")
    db.add_all([plan_thuong, plan_vip])
    db.commit()

    # ---------- Máy tính ----------
    computers = [
        models.Computer(code="PC01", zone="Thường", billing_plan_id=plan_thuong.id),
        models.Computer(code="PC02", zone="Thường", billing_plan_id=plan_thuong.id),
        models.Computer(code="PC03", zone="Thường", billing_plan_id=plan_thuong.id),
        models.Computer(code="PC04", zone="VIP", billing_plan_id=plan_vip.id),
        models.Computer(code="PC05", zone="VIP", billing_plan_id=plan_vip.id),
    ]
    db.add_all(computers)

    # ---------- Sản phẩm ----------
    products = [
        models.Product(name="Coca Cola", category="Đồ uống", price=15000, stock_quantity=50),
        models.Product(name="Pepsi", category="Đồ uống", price=15000, stock_quantity=50),
        models.Product(name="Nước suối", category="Đồ uống", price=10000, stock_quantity=100),
        models.Product(name="Cà phê sữa", category="Đồ uống", price=20000, stock_quantity=30),
        models.Product(name="Mì tôm ly", category="Đồ ăn", price=20000, stock_quantity=40),
        models.Product(name="Snack Oishi", category="Snack", price=10000, stock_quantity=60),
    ]
    db.add_all(products)
    db.commit()

    print("[seed] Đã tạo xong dữ liệu mẫu:")
    print("[seed]   - admin / Admin@123        (Quản trị viên)")
    print("[seed]   - nhanvien1 / NhanVien@123  (Nhân viên)")
    print("[seed]   - khach1 / KhachHang@123    (Khách hàng, số dư 50.000đ)")
    print("[seed]   - khach2 / KhachHang@123    (Khách hàng, số dư 20.000đ)")
    print("[seed]   CẢNH BÁO: đổi ngay mật khẩu các tài khoản mẫu này trước khi triển khai thật!")
