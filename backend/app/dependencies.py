"""
Dependencies dùng chung: lấy user hiện tại từ token, kiểm tra vai trò (RBAC).
Đáp ứng Chương 8.2 Authorization: Role-Based Access Control (RBAC).
"""
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import get_db
from .auth import decode_access_token
from . import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
# auto_error=False -> không tự bắn lỗi 401 nếu thiếu token, dùng cho endpoint
# vừa cho phép ẩn danh (bootstrap tài khoản đầu tiên) vừa cho phép có đăng nhập.
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Không thể xác thực người dùng (token không hợp lệ hoặc đã hết hạn)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def get_optional_current_user(
    token: Optional[str] = Depends(optional_oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    """Giống get_current_user nhưng trả về None thay vì lỗi 401 nếu không có token."""
    if not token:
        return None
    payload = decode_access_token(token)
    if payload is None:
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None or not user.is_active:
        return None
    return user


def require_roles(allowed_roles: List[models.UserRole]):
    """Factory tạo dependency kiểm tra vai trò được phép truy cập endpoint."""

    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền thực hiện thao tác này",
            )
        return current_user

    return role_checker


require_admin = require_roles([models.UserRole.ADMIN])
require_staff_or_admin = require_roles([models.UserRole.ADMIN, models.UserRole.STAFF])
