# Hệ Thống Quản Lý Tiệm Net (Smart Net Cafe)

Đồ án tốt nghiệp - Công nghệ: ReactJS (Frontend) + FastAPI/Python (Backend) + MySQL (Database).

## Chức năng chính
- Quản lý máy tính theo thời gian thực (sơ đồ phòng máy, trạng thái).
- Tự động tính tiền theo giờ khi kết thúc phiên chơi (theo bảng giá).
- Bán hàng tại quầy (POS): đồ ăn, nước uống, tự trừ kho.
- Đặt chỗ trước qua mạng cho khách hàng.
- Báo cáo doanh thu theo ngày, theo từng máy.
- Phân quyền theo vai trò: Admin / Nhân viên / Khách hàng (RBAC).
- Xác thực bằng JWT, mật khẩu băm bcrypt.
- **Nạp tiền tài khoản khách hàng** — Admin/Nhân viên nạp tiền, tự động trừ khi kết thúc phiên chơi.
- **Phân cấp tạo tài khoản** — chỉ Admin/Nhân viên tạo được tài khoản Khách hàng; chỉ Admin tạo được tài khoản Nhân viên. Không còn tự đăng ký công khai.
- **Khách hàng tự đổi mật khẩu** và xem lịch sử/số dư tại trang "Tài khoản của tôi".

## Tài khoản mẫu (tự động tạo khi database còn trống — xem `backend/app/seed_data.py`)

| Vai trò | Tài khoản | Mật khẩu |
|---|---|---|
| Admin | `admin` | `Admin@123` |
| Nhân viên | `nhanvien1` | `NhanVien@123` |
| Khách hàng | `khach1` (số dư 50.000đ) | `KhachHang@123` |
| Khách hàng | `khach2` (số dư 20.000đ) | `KhachHang@123` |

⚠️ Đổi ngay các mật khẩu này trước khi triển khai thật. Dữ liệu mẫu cũng bao
gồm sẵn 2 bảng giá, 5 máy tính, 6 sản phẩm để demo ngay không cần nhập tay.

## Cách 1: Chạy thủ công (không cần Docker)
Xem hướng dẫn chi tiết từng bước ở phần trò chuyện đã gửi, tóm tắt:
1. Cài Python 3.12 + Node.js (đã có).
2. Bật MySQL qua XAMPP, tạo database `tiemnet_db` trống.
3. `cd backend` → tạo venv → `pip install -r requirements.txt` → tạo file `.env` → `python -m uvicorn app.main:app --reload`
4. `cd frontend` → `npm install` → tạo file `.env` → `npm run dev`
5. Tạo tài khoản admin đầu tiên qua Swagger UI (`/docs`).

## Cách 2: Chạy bằng Docker (khuyến nghị khi đã quen, dùng cho demo/triển khai)

Yêu cầu: đã cài **Docker Desktop** (tải tại https://www.docker.com/products/docker-desktop/).

Tại thư mục gốc dự án, chạy:

```bash
docker compose up --build
```

Chờ khoảng 1-2 phút để build xong 3 container: `db` (MySQL), `backend` (FastAPI), `frontend` (Nginx + React).

Truy cập:
- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs

Dừng hệ thống: `Ctrl + C` rồi chạy `docker compose down` (thêm `-v` nếu muốn xóa luôn dữ liệu database).

## Cấu trúc thư mục

```
tiemnet-project/
├── backend/            # FastAPI + SQLAlchemy + MySQL
│   ├── app/
│   │   ├── routers/    # Các API endpoint (auth, computers, sessions, orders...)
│   │   ├── models.py   # Định nghĩa bảng dữ liệu
│   │   ├── schemas.py  # Pydantic schema request/response
│   │   ├── auth.py     # JWT + hash password
│   │   └── dependencies.py  # Phân quyền RBAC
│   ├── tests/          # Unit test & Integration test (pytest)
│   └── Dockerfile
├── frontend/            # ReactJS (Vite) + React Router + Axios + Bootstrap
│   ├── src/
│   │   ├── pages/       # Các trang giao diện
│   │   ├── components/  # NavBar, ProtectedRoute
│   │   ├── context/      # AuthContext (quản lý đăng nhập)
│   │   └── services/     # Cấu hình gọi API (axios)
│   └── Dockerfile
├── docker-compose.yml    # Chạy toàn bộ hệ thống bằng 1 lệnh
└── .github/workflows/    # GitHub Actions CI/CD pipeline
```

## CI/CD (GitHub Actions)
File `.github/workflows/ci-cd.yml` tự động chạy khi push lên nhánh `main`:
1. **backend-test**: cài Python, chạy `pytest` (unit test + integration test).
2. **frontend-build**: cài Node, chạy `npm run build`, lưu bản build.
3. **docker-build**: build Docker image cho cả backend và frontend (chỉ chạy nếu 2 job trên pass).

## Triển khai Cloud (gợi ý)
- Frontend → **Vercel** (kết nối trực tiếp thư mục `frontend`, build command `npm run build`, output `dist`).
- Backend → **Render** hoặc **Railway** (deploy từ Dockerfile trong `backend`).
- Database → MySQL Cloud (PlanetScale, Railway MySQL, hoặc Render MySQL).
