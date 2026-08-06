"""
Unit Test & Integration Test cơ bản (Chương 9: Software Testing).
Chạy: TESTING=1 pytest
"""
import os
os.environ["TESTING"] = "1"

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


def register_and_login(role="admin", username="admin1"):
    client.post(
        "/api/auth/register",
        json={"username": username, "password": "Passw0rd!", "role": role, "full_name": "Test User"},
    )
    resp = client.post(
        "/api/auth/login",
        data={"username": username, "password": "Passw0rd!"},
    )
    return resp.json()["access_token"]


def test_health_check():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_register_and_login():
    token = register_and_login()
    assert token is not None


def test_login_wrong_password_fails():
    register_and_login()
    resp = client.post("/api/auth/login", data={"username": "admin1", "password": "wrong"})
    assert resp.status_code == 401


def test_create_billing_plan_requires_admin():
    token = register_and_login(role="admin", username="admin2")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post(
        "/api/billing-plans/",
        json={"name": "Gio thuong", "price_per_hour": 6000, "description": "Bang gia mac dinh"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["price_per_hour"] == 6000


def test_customer_cannot_create_billing_plan():
    token = register_and_login(role="customer", username="cust1")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post(
        "/api/billing-plans/",
        json={"name": "Gio VIP", "price_per_hour": 10000},
        headers=headers,
    )
    assert resp.status_code == 403


def test_full_session_billing_flow():
    """Test luồng: tạo bảng giá -> tạo máy -> bắt đầu phiên -> kết thúc phiên -> tính tiền."""
    token = register_and_login(role="admin", username="admin3")
    headers = {"Authorization": f"Bearer {token}"}

    plan_resp = client.post(
        "/api/billing-plans/",
        json={"name": "Gio thuong", "price_per_hour": 8000},
        headers=headers,
    )
    plan_id = plan_resp.json()["id"]

    computer_resp = client.post(
        "/api/computers/",
        json={"code": "PC01", "zone": "Thuong", "billing_plan_id": plan_id},
        headers=headers,
    )
    assert computer_resp.status_code == 200
    computer_id = computer_resp.json()["id"]

    start_resp = client.post(
        "/api/sessions/start", json={"computer_id": computer_id}, headers=headers
    )
    assert start_resp.status_code == 200
    session_id = start_resp.json()["id"]
    assert start_resp.json()["status"] == "active"

    stop_resp = client.post(f"/api/sessions/{session_id}/stop", headers=headers)
    assert stop_resp.status_code == 200
    assert stop_resp.json()["status"] == "completed"
    # Tối thiểu tính phí 15 phút = 0.25 * 8000 = 2000
    assert stop_resp.json()["total_amount"] >= 2000


def test_pos_order_reduces_stock():
    token = register_and_login(role="admin", username="admin4")
    headers = {"Authorization": f"Bearer {token}"}

    product_resp = client.post(
        "/api/products/",
        json={"name": "Coca Cola", "category": "Do uong", "price": 15000, "stock_quantity": 10},
        headers=headers,
    )
    product_id = product_resp.json()["id"]

    order_resp = client.post(
        "/api/orders/",
        json={"items": [{"product_id": product_id, "quantity": 3}]},
        headers=headers,
    )
    assert order_resp.status_code == 200
    assert order_resp.json()["total_amount"] == 45000

    product_check = client.get("/api/products/").json()
    updated_product = next(p for p in product_check if p["id"] == product_id)
    assert updated_product["stock_quantity"] == 7


def test_weak_password_rejected():
    """Chương 8 - Bảo mật: mật khẩu yếu (không đủ hoa/thường/số/độ dài) phải bị từ chối."""
    resp = client.post(
        "/api/auth/register",
        json={"username": "weakpass1", "password": "12345", "role": "customer"},
    )
    assert resp.status_code == 422  # Lỗi validation của Pydantic


def test_account_locks_after_repeated_failed_logins():
    """Chương 8 - Bảo mật: khóa tài khoản tạm thời sau 5 lần đăng nhập sai liên tiếp."""
    register_and_login(role="customer", username="lockme")

    for _ in range(5):
        resp = client.post("/api/auth/login", data={"username": "lockme", "password": "wrong"})
        assert resp.status_code in (401, 403)

    # Lần thứ 6, dù nhập đúng mật khẩu vẫn phải bị từ chối vì tài khoản đang khóa
    resp = client.post("/api/auth/login", data={"username": "lockme", "password": "Passw0rd!"})
    assert resp.status_code == 403
    assert "khóa" in resp.json()["detail"]
