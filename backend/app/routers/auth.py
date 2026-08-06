import datetime as dt
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..auth import hash_password, verify_password, create_access_token
from ..dependencies import get_current_user, get_optional_current_user
from ..limiter import limiter

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(
    request: Request,
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_current_user),
):
    """
    Tạo tài khoản mới. Quy tắc phân quyền (Chương 8 + nghiệp vụ tiệm net):

    - Nếu hệ thống CHƯA có tài khoản nào (mới cài đặt lần đầu): cho phép tạo
      tự do, không cần đăng nhập (bootstrap tài khoản Admin đầu tiên).
    - Nếu đã có tài khoản: BẮT BUỘC đăng nhập trước, và:
        - Tạo tài khoản Khách hàng -> chỉ Admin hoặc Nhân viên được phép
        - Tạo tài khoản Nhân viên  -> chỉ Admin được phép
        - Tạo tài khoản Admin      -> chỉ Admin được phép
    """
    existing = db.query(models.User).filter(models.User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")

    total_users = db.query(models.User).count()

    if total_users > 0:
        if current_user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Cần đăng nhập để tạo tài khoản mới",
            )
        if user_in.role == models.UserRole.CUSTOMER:
            if current_user.role not in (models.UserRole.ADMIN, models.UserRole.STAFF):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Chỉ Admin hoặc Nhân viên được tạo tài khoản khách hàng",
                )
        else:  # role == staff hoặc admin
            if current_user.role != models.UserRole.ADMIN:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Chỉ Admin được tạo tài khoản Nhân viên/Admin",
                )

    user = models.User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        phone=user_in.phone,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
@limiter.limit("10/minute")  # chống brute-force dò mật khẩu
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Đăng nhập, trả về JWT access token. Tự khóa tạm thời sau 5 lần sai liên tiếp."""
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Sai tên đăng nhập hoặc mật khẩu")

    # Kiểm tra tài khoản có đang bị khóa tạm thời không
    if user.locked_until and user.locked_until > dt.datetime.utcnow():
        remaining = int((user.locked_until - dt.datetime.utcnow()).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Tài khoản tạm khóa do đăng nhập sai quá nhiều lần. Thử lại sau {remaining} phút.",
        )

    if not verify_password(form_data.password, user.hashed_password):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
            user.locked_until = dt.datetime.utcnow() + dt.timedelta(minutes=LOCKOUT_MINUTES)
            user.failed_login_attempts = 0
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Đăng nhập sai {MAX_FAILED_ATTEMPTS} lần liên tiếp. Tài khoản bị khóa {LOCKOUT_MINUTES} phút.",
            )
        db.commit()
        raise HTTPException(status_code=401, detail="Sai tên đăng nhập hoặc mật khẩu")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa")

    # Đăng nhập đúng -> reset bộ đếm sai
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return schemas.Token(access_token=access_token, user=user)


@router.get("/me", response_model=schemas.UserOut)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.put("/change-password")
def change_password(
    payload: schemas.ChangePasswordRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Người dùng tự đổi mật khẩu của chính mình (yêu cầu nhập đúng mật khẩu cũ)."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Đổi mật khẩu thành công"}
