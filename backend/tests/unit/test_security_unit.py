"""
UNIT TEST (Chương 9.1) — kiểm thử từng hàm riêng lẻ, độc lập với DB và HTTP.
Khác với Integration Test: unit test không gọi TestClient, không chạm database.
"""
import os
os.environ["TESTING"] = "1"

import pytest
from pydantic import ValidationError

from app.auth import hash_password, verify_password, create_access_token, decode_access_token
from app.schemas import UserCreate


class TestPasswordHashing:
    """Unit test cho module băm mật khẩu (app/auth.py)."""

    def test_hash_password_returns_different_string(self):
        hashed = hash_password("MatKhau123")
        assert hashed != "MatKhau123"
        assert len(hashed) > 20

    def test_same_password_produces_different_hash_each_time(self):
        """bcrypt tự sinh salt ngẫu nhiên -> 2 lần hash cùng 1 mật khẩu phải khác nhau."""
        hash1 = hash_password("MatKhau123")
        hash2 = hash_password("MatKhau123")
        assert hash1 != hash2

    def test_verify_password_correct(self):
        hashed = hash_password("MatKhau123")
        assert verify_password("MatKhau123", hashed) is True

    def test_verify_password_incorrect(self):
        hashed = hash_password("MatKhau123")
        assert verify_password("SaiMatKhau", hashed) is False


class TestJWTToken:
    """Unit test cho module tạo/giải mã JWT (app/auth.py)."""

    def test_create_and_decode_token(self):
        token = create_access_token({"sub": "1", "role": "admin"})
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "1"
        assert payload["role"] == "admin"

    def test_decode_invalid_token_returns_none(self):
        assert decode_access_token("token.gia.mao") is None

    def test_decode_tampered_token_returns_none(self):
        token = create_access_token({"sub": "1"})
        tampered = token[:-3] + "xyz"  # chỉnh sửa chữ ký token
        assert decode_access_token(tampered) is None


class TestPasswordPolicy:
    """Unit test cho chính sách mật khẩu mạnh (app/schemas.py)."""

    @pytest.mark.parametrize("weak_password", [
        "12345",        # quá ngắn
        "abcdefgh",     # thiếu chữ hoa và số
        "ABCDEFGH",     # thiếu chữ thường và số
        "Abcdefgh",     # thiếu số
    ])
    def test_weak_passwords_rejected(self, weak_password):
        with pytest.raises(ValidationError):
            UserCreate(username="test", password=weak_password)

    def test_strong_password_accepted(self):
        user = UserCreate(username="test", password="MatKhau123")
        assert user.password == "MatKhau123"
