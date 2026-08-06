# Chương 8 — Bảo mật ứng dụng Web (Web Security)

Tài liệu này tổng hợp các biện pháp bảo mật đã áp dụng trong hệ thống, dùng làm
cơ sở viết Chương 8 của báo cáo đồ án tốt nghiệp.

## 8.1 Authentication (Xác thực)

- **JWT (JSON Web Token)**: người dùng đăng nhập bằng `username/password`, hệ
  thống trả về `access_token` (JWT) ký bằng thuật toán HS256, hết hạn sau
  120 phút (`ACCESS_TOKEN_EXPIRE_MINUTES`). Token được đính kèm ở header
  `Authorization: Bearer <token>` cho mọi request cần xác thực.
  (`backend/app/auth.py`, `backend/app/dependencies.py`)
- **Hash Password bằng bcrypt**: mật khẩu không bao giờ lưu dạng plain-text,
  luôn băm bằng `bcrypt` (qua thư viện `passlib`) trước khi lưu vào database.
  (`backend/app/auth.py::hash_password`)
- **Chính sách mật khẩu mạnh**: khi đăng ký, mật khẩu bắt buộc tối thiểu 8 ký
  tự, có chữ hoa, chữ thường và chữ số (theo khuyến nghị OWASP Authentication
  Cheat Sheet). (`backend/app/schemas.py::UserCreate.validate_password_strength`)
- **Khóa tài khoản tạm thời (Account Lockout)**: sau 5 lần đăng nhập sai liên
  tiếp, tài khoản bị khóa tự động 15 phút để chống tấn công brute-force dò mật
  khẩu. (`backend/app/routers/auth.py::login`)
- OAuth2 / SSO: hệ thống hiện dùng cơ chế `OAuth2PasswordBearer` chuẩn của
  FastAPI (tương thích chuẩn OAuth2 Password Flow) làm nền tảng xác thực;
  phần tích hợp SSO qua bên thứ ba (Google/Facebook Login) là hướng mở rộng.

## 8.2 Authorization (Phân quyền)

- **RBAC (Role-Based Access Control)**: 3 vai trò `admin`, `staff`,
  `customer`. Mỗi endpoint API khai báo rõ vai trò được phép truy cập thông
  qua dependency `require_admin` / `require_staff_or_admin`.
  (`backend/app/dependencies.py`)
- Ma trận quyền chi tiết: xem bảng phân quyền trong README.md.
- **Phân cấp quyền tạo tài khoản** (bổ sung theo yêu cầu nghiệp vụ thực tế của
  tiệm net): không còn cho phép tự đăng ký công khai. Quy tắc:
  - Tài khoản đầu tiên của hệ thống (bootstrap khi database trống) được tạo
    tự do để khởi tạo Admin ban đầu.
  - Sau đó, tạo tài khoản **Khách hàng** chỉ Admin hoặc Nhân viên được phép.
  - Tạo tài khoản **Nhân viên** chỉ Admin được phép.
  - Logic nằm ở `backend/app/routers/auth.py::register`, dùng
    `get_optional_current_user` để vừa hỗ trợ bootstrap ẩn danh, vừa bắt buộc
    xác thực + kiểm tra vai trò khi hệ thống đã có dữ liệu.

## 8.3 Các lỗ hổng phổ biến

| Lỗ hổng | Biện pháp phòng chống đã áp dụng |
|---|---|
| **SQL Injection** | Toàn bộ truy vấn dùng SQLAlchemy ORM (parameterized query), không nối chuỗi SQL thủ công → tự động chống SQL Injection. |
| **XSS (Cross-Site Scripting)** | ReactJS tự động escape dữ liệu khi render (`{value}` trong JSX không thực thi HTML/JS lạ), hạn chế `dangerouslySetInnerHTML`. |
| **CSRF (Cross-Site Request Forgery)** | Hệ thống dùng JWT Bearer Token gửi qua header (không dùng cookie để xác thực) → giảm thiểu rủi ro CSRF so với cơ chế session-cookie truyền thống. |
| **Broken Authentication** | Áp dụng hash password + rate limiting + account lockout (xem 8.1). |
| **Brute-force / DDoS** | Rate limiting bằng `slowapi`: giới hạn 10 lần đăng nhập/phút, 5 lần đăng ký/phút, 100 request/phút cho toàn hệ thống theo địa chỉ IP. (`backend/app/limiter.py`) |

## 8.4 Hash Password

Xem mục 8.1 — dùng `bcrypt` với salt tự động sinh cho từng mật khẩu, đảm bảo
2 người dùng có cùng mật khẩu vẫn cho ra 2 chuỗi hash khác nhau.

## 8.5 HTTPS: SSL, TLS

- Ở môi trường local/Docker, hệ thống chạy HTTP để đơn giản hóa việc phát
  triển.
- Khi triển khai Cloud (Chương 6): Vercel và Render đều **tự động cung cấp
  chứng chỉ SSL/TLS miễn phí** cho domain triển khai, nên toàn bộ giao tiếp
  Frontend ↔ Backend khi lên production đều qua HTTPS mà không cần cấu hình
  thêm.
- Biến môi trường `CORS_ORIGINS` được giới hạn theo domain cụ thể (không còn
  để `*`) để chỉ Frontend hợp lệ mới gọi được API. (`backend/app/main.py`)

## Tổng kết Chương 8

| Nội dung đề cương | Trạng thái |
|---|---|
| 8.1 Authentication: JWT, OAuth2, SSO | ✅ JWT + OAuth2 Password Flow (SSO là hướng mở rộng) |
| 8.2 Authorization: RBAC | ✅ Đã triển khai đầy đủ |
| 8.3 SQL Injection, XSS, CSRF, Broken Auth | ✅ Đã phòng chống + giải thích cơ chế |
| 8.4 Hash Password | ✅ bcrypt |
| 8.5 HTTPS/SSL/TLS | ✅ Tự động khi deploy Cloud (Chương 6) |
