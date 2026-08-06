"""
INTEGRATION TEST (Chương 9.2) — kiểm thử nhiều endpoint API phối hợp với nhau
trong cùng một luồng nghiệp vụ thực tế (không chỉ test 1 hàm đơn lẻ).
"""
import os
os.environ["TESTING"] = "1"

import datetime as dt
import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def _register(username, role="customer", password="Passw0rd!", token=None):
    headers = _auth_header(token) if token else {}
    return client.post(
        "/api/auth/register",
        json={"username": username, "password": password, "role": role, "full_name": "Test User"},
        headers=headers,
    )


def _login(username, password="Passw0rd!"):
    resp = client.post("/api/auth/login", data={"username": username, "password": password})
    return resp.json()["access_token"]


def _register_and_login(username, role="admin", token=None):
    _register(username, role=role, token=token)
    return _login(username)


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------- Luồng: Quản lý người dùng (Admin) ----------------
def test_admin_can_manage_users():
    admin_token = _register_and_login("admin_users", role="admin")  # bootstrap tài khoản đầu tiên
    headers = _auth_header(admin_token)
    _register_and_login("customer_a", role="customer", token=admin_token)  # Admin tạo khách hàng

    # Admin xem danh sách người dùng
    resp = client.get("/api/users/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 2

    customer = next(u for u in resp.json() if u["username"] == "customer_a")

    # Admin nâng cấp customer thành staff
    update_resp = client.put(
        f"/api/users/{customer['id']}", json={"role": "staff"}, headers=headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["role"] == "staff"

    # Admin vô hiệu hóa tài khoản
    deactivate_resp = client.delete(f"/api/users/{customer['id']}", headers=headers)
    assert deactivate_resp.status_code == 200

    # Tài khoản bị khóa không đăng nhập được nữa
    login_resp = client.post(
        "/api/auth/login", data={"username": "customer_a", "password": "Passw0rd!"}
    )
    assert login_resp.status_code == 403


def test_staff_cannot_manage_users():
    """RBAC: Staff không được phép sửa/xóa người dùng (chỉ Admin mới được)."""
    staff_token = _register_and_login("staff_no_perm", role="staff")
    headers = _auth_header(staff_token)
    resp = client.get("/api/users/", headers=headers)
    assert resp.status_code == 200  # Staff được xem danh sách

    resp2 = client.put("/api/users/1", json={"role": "admin"}, headers=headers)
    assert resp2.status_code == 403  # nhưng không được sửa vai trò


# ---------------- Luồng: Quản lý máy tính (CRUD đầy đủ) ----------------
def test_computer_crud_flow():
    admin_token = _register_and_login("admin_pc", role="admin")
    headers = _auth_header(admin_token)

    plan_resp = client.post(
        "/api/billing-plans/", json={"name": "Gio VIP", "price_per_hour": 12000}, headers=headers
    )
    plan_id = plan_resp.json()["id"]

    create_resp = client.post(
        "/api/computers/", json={"code": "PC99", "zone": "VIP", "billing_plan_id": plan_id}, headers=headers
    )
    assert create_resp.status_code == 200
    computer_id = create_resp.json()["id"]

    # Không được tạo trùng mã máy
    dup_resp = client.post(
        "/api/computers/", json={"code": "PC99", "zone": "VIP", "billing_plan_id": plan_id}, headers=headers
    )
    assert dup_resp.status_code == 400

    # Cập nhật trạng thái sang bảo trì
    update_resp = client.put(
        f"/api/computers/{computer_id}", json={"status": "maintenance"}, headers=headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "maintenance"

    # Xóa máy
    delete_resp = client.delete(f"/api/computers/{computer_id}", headers=headers)
    assert delete_resp.status_code == 200

    list_resp = client.get("/api/computers/", headers=headers)
    assert all(c["id"] != computer_id for c in list_resp.json())


# ---------------- Luồng: Đặt chỗ trước (Booking) ----------------
def test_customer_booking_flow():
    admin_token = _register_and_login("admin_booking", role="admin")  # bootstrap
    staff_token = _register_and_login("staff_booking", role="staff", token=admin_token)  # chỉ Admin tạo được Staff
    customer_token = _register_and_login("cust_booking", role="customer", token=admin_token)  # Admin/Staff tạo được Customer

    booking_time = (dt.datetime.utcnow() + dt.timedelta(hours=2)).isoformat()
    create_resp = client.post(
        "/api/bookings/",
        json={"booking_time": booking_time, "duration_minutes": 90, "zone_preference": "VIP"},
        headers=_auth_header(customer_token),
    )
    assert create_resp.status_code == 200
    booking_id = create_resp.json()["id"]
    assert create_resp.json()["status"] == "pending"

    # Khách hàng xem lịch sử đặt chỗ của chính mình
    my_bookings = client.get("/api/bookings/my-bookings", headers=_auth_header(customer_token))
    assert len(my_bookings.json()) == 1

    # Nhân viên xác nhận đặt chỗ
    confirm_resp = client.put(
        f"/api/bookings/{booking_id}", json={"status": "confirmed"}, headers=_auth_header(staff_token)
    )
    assert confirm_resp.status_code == 200
    assert confirm_resp.json()["status"] == "confirmed"

    # Khách hàng không được tự xác nhận đặt chỗ của chính mình (chỉ staff/admin)
    forbidden_resp = client.put(
        f"/api/bookings/{booking_id}", json={"status": "completed"}, headers=_auth_header(customer_token)
    )
    assert forbidden_resp.status_code == 403


# ---------------- Luồng: Quản lý sản phẩm (sửa/ẩn) ----------------
def test_product_update_and_deactivate_flow():
    admin_token = _register_and_login("admin_product", role="admin")
    headers = _auth_header(admin_token)

    create_resp = client.post(
        "/api/products/",
        json={"name": "Snack A", "category": "Snack", "price": 10000, "stock_quantity": 20},
        headers=headers,
    )
    product_id = create_resp.json()["id"]

    update_resp = client.put(
        f"/api/products/{product_id}", json={"price": 12000, "stock_quantity": 25}, headers=headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["price"] == 12000

    deactivate_resp = client.delete(f"/api/products/{product_id}", headers=headers)
    assert deactivate_resp.status_code == 200

    list_resp = client.get("/api/products/")
    assert all(p["id"] != product_id for p in list_resp.json())  # sản phẩm đã ẩn không hiện trong danh sách bán


# ---------------- Luồng: Báo cáo doanh thu tổng hợp ----------------
def test_revenue_and_computer_usage_report():
    admin_token = _register_and_login("admin_report", role="admin")
    headers = _auth_header(admin_token)

    plan_resp = client.post(
        "/api/billing-plans/", json={"name": "Gio thuong", "price_per_hour": 8000}, headers=headers
    )
    plan_id = plan_resp.json()["id"]
    computer_resp = client.post(
        "/api/computers/", json={"code": "PC-R1", "zone": "Thuong", "billing_plan_id": plan_id}, headers=headers
    )
    computer_id = computer_resp.json()["id"]

    start_resp = client.post("/api/sessions/start", json={"computer_id": computer_id}, headers=headers)
    session_id = start_resp.json()["id"]
    client.post(f"/api/sessions/{session_id}/stop", headers=headers)

    today = dt.date.today().isoformat()
    report_resp = client.get(
        "/api/reports/revenue", params={"from_date": today, "to_date": today}, headers=headers
    )
    assert report_resp.status_code == 200
    assert report_resp.json()["total_sessions"] == 1
    assert report_resp.json()["total_session_revenue"] > 0

    usage_resp = client.get("/api/reports/computer-usage", headers=headers)
    assert usage_resp.status_code == 200
    pc_usage = next(u for u in usage_resp.json() if u["computer_code"] == "PC-R1")
    assert pc_usage["total_sessions"] == 1
