"""
INTEGRATION TEST — Phân quyền tạo tài khoản theo cấp bậc + Nạp tiền + Đổi mật khẩu.
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
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    return client.post(
        "/api/auth/register",
        json={"username": username, "password": password, "role": role, "full_name": "Test User"},
        headers=headers,
    )


def _login(username, password="Passw0rd!"):
    resp = client.post("/api/auth/login", data={"username": username, "password": password})
    return resp.json()["access_token"]


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------- Phân quyền tạo tài khoản ----------------
def test_bootstrap_first_account_allows_anonymous():
    """Tài khoản đầu tiên của hệ thống được tạo tự do, không cần đăng nhập."""
    resp = _register("first_admin", role="admin")
    assert resp.status_code == 201


def test_anonymous_cannot_register_after_bootstrap():
    """Sau khi đã có tài khoản đầu tiên, đăng ký ẩn danh phải bị từ chối."""
    _register("boss", role="admin")  # bootstrap
    resp = _register("someone_else", role="customer")  # không kèm token
    assert resp.status_code == 401


def test_staff_can_create_customer_but_not_staff():
    _register("admin1", role="admin")
    admin_token = _login("admin1")
    _register("staff1", role="staff", token=admin_token)
    staff_token = _login("staff1")

    # Staff được tạo tài khoản khách hàng
    resp = _register("customer_by_staff", role="customer", token=staff_token)
    assert resp.status_code == 201

    # Staff KHÔNG được tạo tài khoản nhân viên khác
    resp2 = _register("staff_by_staff", role="staff", token=staff_token)
    assert resp2.status_code == 403

    # Staff KHÔNG được tạo tài khoản admin
    resp3 = _register("admin_by_staff", role="admin", token=staff_token)
    assert resp3.status_code == 403


def test_customer_cannot_create_any_account():
    _register("adminX", role="admin")
    admin_token = _login("adminX")
    _register("cust1", role="customer", token=admin_token)
    customer_token = _login("cust1")

    resp = _register("cust2", role="customer", token=customer_token)
    assert resp.status_code == 403


def test_only_admin_can_create_staff():
    _register("admin_boot", role="admin")
    admin_token = _login("admin_boot")

    resp = _register("staff_new", role="staff", token=admin_token)
    assert resp.status_code == 201
    assert resp.json()["role"] == "staff"


# ---------------- Nạp tiền (Top-up) ----------------
def test_topup_balance_flow():
    _register("admin_topup", role="admin")
    admin_token = _login("admin_topup")
    headers = _auth_header(admin_token)

    _register("cust_topup", role="customer", token=admin_token)
    customer = next(
        u for u in client.get("/api/users/", headers=headers).json() if u["username"] == "cust_topup"
    )
    assert customer["balance"] == 0

    resp = client.post(
        f"/api/users/{customer['id']}/topup", json={"amount": 100000}, headers=headers
    )
    assert resp.status_code == 200
    assert resp.json()["balance"] == 100000

    # Nạp thêm lần 2 phải cộng dồn
    resp2 = client.post(
        f"/api/users/{customer['id']}/topup", json={"amount": 50000}, headers=headers
    )
    assert resp2.json()["balance"] == 150000


def test_topup_rejects_negative_amount():
    _register("admin_topup2", role="admin")
    admin_token = _login("admin_topup2")
    headers = _auth_header(admin_token)
    _register("cust_topup2", role="customer", token=admin_token)
    customer = next(
        u for u in client.get("/api/users/", headers=headers).json() if u["username"] == "cust_topup2"
    )
    resp = client.post(f"/api/users/{customer['id']}/topup", json={"amount": -5000}, headers=headers)
    assert resp.status_code == 422


def test_session_stop_deducts_customer_balance():
    """Kết thúc phiên chơi phải tự động trừ tiền vào số dư khách hàng đã nạp trước đó."""
    _register("admin_deduct", role="admin")
    admin_token = _login("admin_deduct")
    headers = _auth_header(admin_token)

    _register("cust_deduct", role="customer", token=admin_token)
    customer = next(
        u for u in client.get("/api/users/", headers=headers).json() if u["username"] == "cust_deduct"
    )
    client.post(f"/api/users/{customer['id']}/topup", json={"amount": 100000}, headers=headers)

    plan_id = client.post(
        "/api/billing-plans/", json={"name": "Gio thuong", "price_per_hour": 8000}, headers=headers
    ).json()["id"]
    computer_id = client.post(
        "/api/computers/", json={"code": "PC-BAL", "zone": "Thuong", "billing_plan_id": plan_id}, headers=headers
    ).json()["id"]

    session_resp = client.post(
        "/api/sessions/start",
        json={"computer_id": computer_id, "customer_id": customer["id"]},
        headers=headers,
    )
    session_id = session_resp.json()["id"]
    stop_resp = client.post(f"/api/sessions/{session_id}/stop", headers=headers)
    fee = stop_resp.json()["total_amount"]

    updated_customer = client.get(f"/api/users/{customer['id']}", headers=headers).json()
    assert updated_customer["balance"] == 100000 - fee


# ---------------- Đổi mật khẩu ----------------
def test_change_password_flow():
    _register("user_pw", role="customer")  # bootstrap
    token = _login("user_pw")
    headers = _auth_header(token)

    resp = client.put(
        "/api/auth/change-password",
        json={"current_password": "Passw0rd!", "new_password": "NewPassw0rd1"},
        headers=headers,
    )
    assert resp.status_code == 200

    # Mật khẩu cũ không còn dùng được
    old_login = client.post("/api/auth/login", data={"username": "user_pw", "password": "Passw0rd!"})
    assert old_login.status_code == 401

    # Mật khẩu mới đăng nhập được
    new_login = client.post("/api/auth/login", data={"username": "user_pw", "password": "NewPassw0rd1"})
    assert new_login.status_code == 200


def test_change_password_wrong_current_password_rejected():
    _register("user_pw2", role="customer")
    token = _login("user_pw2")
    headers = _auth_header(token)

    resp = client.put(
        "/api/auth/change-password",
        json={"current_password": "SaiMatKhau", "new_password": "NewPassw0rd1"},
        headers=headers,
    )
    assert resp.status_code == 400


def test_change_password_weak_new_password_rejected():
    _register("user_pw3", role="customer")
    token = _login("user_pw3")
    headers = _auth_header(token)

    resp = client.put(
        "/api/auth/change-password",
        json={"current_password": "Passw0rd!", "new_password": "123"},
        headers=headers,
    )
    assert resp.status_code == 422
