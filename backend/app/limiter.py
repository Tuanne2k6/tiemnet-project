"""
Cấu hình Rate Limiter dùng chung (tách riêng để tránh circular import
giữa main.py và các router).
"""
import os
from slowapi import Limiter
from slowapi.util import get_remote_address

# Tắt rate limit khi chạy pytest (TESTING=1) để không làm sai lệch kết quả test
_enabled = os.getenv("TESTING") != "1"

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"], enabled=_enabled)
