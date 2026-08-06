# E2E Test (End-to-End) — Chương 9.3

Bộ test này mô phỏng thao tác của người dùng thật trên trình duyệt (không gọi
thẳng API như Unit/Integration Test), dùng thư viện **Playwright**.

## Yêu cầu trước khi chạy

Frontend (`http://localhost:5173`) và Backend (`http://localhost:8000`) phải
đang chạy — bằng 1 trong 2 cách:

```bash
# Cách 1: Docker Compose (khuyến nghị, tại thư mục gốc project)
docker compose up -d

# Cách 2: chạy thủ công 2 terminal (backend uvicorn + frontend npm run dev)
```

Hệ thống cần có sẵn tài khoản Admin mẫu từ `seed_data.py` (tự động tạo khi
database còn trống, xem `backend/app/seed_data.py`): `admin` / `Admin@123`.
Nếu bạn đã đổi mật khẩu tài khoản này, cập nhật lại 2 hằng số
`SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` ở đầu file
`tests/full-flow.spec.js` trước khi chạy.

## Cài đặt & chạy E2E test

```bash
cd e2e
npm install
npx playwright install --with-deps chromium   # tải trình duyệt Chromium cho Playwright
npm test
```

Xem báo cáo kết quả dạng giao diện web:
```bash
npm run report
```

## Nội dung kiểm thử

| Kịch bản | Mô tả |
|---|---|
| Luồng khách hàng | Đăng ký → đăng nhập → xác nhận chỉ thấy menu khách hàng → không vào được URL quản trị |
| Luồng quản trị | Đăng nhập admin → tạo bảng giá → thêm máy → bắt đầu/kết thúc phiên chơi → xác nhận báo cáo doanh thu ghi nhận đúng |

## Lưu ý
- Mỗi lần chạy tự sinh username ngẫu nhiên (theo timestamp) để tránh lỗi
  "tên đăng nhập đã tồn tại" khi chạy lại nhiều lần trên cùng 1 database.
- Đây là test chạy trên **giao diện thật**, nên nếu bạn đổi tên nút/label
  trong code Frontend, cần cập nhật lại `tests/full-flow.spec.js` tương ứng.
