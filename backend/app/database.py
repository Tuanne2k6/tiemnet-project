"""
Cấu hình kết nối cơ sở dữ liệu MySQL bằng SQLAlchemy.
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Tự động đọc file .env trong thư mục backend/ (nếu có)
load_dotenv()

# Chuỗi kết nối lấy từ biến môi trường (phù hợp Docker / Cloud deploy)
# Ví dụ: mysql+pymysql://user:password@localhost:3306/tiemnet_db
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:root@localhost:3306/tiemnet_db"
)

# Cho phép chạy test bằng SQLite in-memory khi cần
if os.getenv("TESTING") == "1":
    DATABASE_URL = "sqlite:///./test.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency cung cấp session DB cho từng request, tự đóng khi xong."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
