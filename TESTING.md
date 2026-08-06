# Chương 9 — Kiểm thử phần mềm (Software Testing)

Tài liệu tổng hợp toàn bộ công tác kiểm thử đã thực hiện, dùng làm cơ sở viết
Chương 9 của báo cáo đồ án tốt nghiệp.

## 9.1 Unit Test (Kiểm thử đơn vị)

### Backend — `backend/tests/unit/test_security_unit.py`
Kiểm thử từng hàm riêng lẻ, độc lập với database và HTTP:
- `TestPasswordHashing`: băm mật khẩu bcrypt, xác thực đúng/sai mật khẩu, xác
  nhận mỗi lần hash cho ra chuỗi khác nhau (salt ngẫu nhiên).
- `TestJWTToken`: tạo/giải mã JWT hợp lệ, từ chối token giả mạo hoặc bị sửa đổi.
- `TestPasswordPolicy`: từ chối 4 loại mật khẩu yếu (thiếu hoa/thường/số/độ dài),
  chấp nhận mật khẩu đủ mạnh.

### Frontend — `frontend/src/utils/__tests__/format.test.js`, `Login.test.jsx`, `ProtectedRoute.test.jsx`
- Hàm thuần `formatCurrency`, `calculateSessionFee` (tách riêng logic tính
  tiền khỏi component để dễ kiểm thử).
- Component `Login`: đầy đủ trường bắt buộc, input password ẩn ký tự, cho
  phép nhập liệu.
- Component `ProtectedRoute`: kiểm thử logic RBAC ở tầng giao diện — chuyển
  hướng đúng khi chưa đăng nhập / sai vai trò / đúng vai trò.

Công cụ: `pytest` (Backend), `Vitest` + `React Testing Library` (Frontend).

## 9.2 Integration Test (Kiểm thử tích hợp API)

`backend/tests/integration/test_api_flows.py` và `test_extended_flows.py` —
kiểm thử nhiều endpoint phối hợp trong 1 luồng nghiệp vụ thật, có kết nối
database (SQLite in-memory khi test):

| Luồng nghiệp vụ | File |
|---|---|
| Đăng ký → đăng nhập → RBAC theo vai trò | test_api_flows.py |
| Toàn bộ chu trình tính tiền giờ chơi (tạo bảng giá → tạo máy → bắt đầu → kết thúc phiên) | test_api_flows.py |
| Bán hàng POS trừ kho tự động | test_api_flows.py |
| Chính sách mật khẩu mạnh + khóa tài khoản brute-force | test_api_flows.py |
| Quản lý người dùng (nâng quyền, khóa tài khoản) + RBAC Admin-only | test_extended_flows.py |
| CRUD máy tính đầy đủ (thêm/sửa/xóa, chống trùng mã máy) | test_extended_flows.py |
| Đặt chỗ: khách đặt → nhân viên xác nhận → RBAC khách không tự xác nhận được | test_extended_flows.py |
| Sửa/ẩn sản phẩm | test_extended_flows.py |
| Báo cáo doanh thu + mức sử dụng từng máy | test_extended_flows.py |

## 9.3 End-to-End Test (Kiểm thử toàn trình)

`e2e/tests/full-flow.spec.js` — dùng **Playwright** điều khiển trình duyệt
thật, thao tác y hệt người dùng cuối (click, gõ phím, đọc màn hình):

- **Luồng khách hàng**: đăng ký qua giao diện → đăng nhập → xác nhận đúng
  menu hiển thị theo vai trò → không thể truy cập thẳng URL quản trị.
- **Luồng quản trị**: đăng nhập admin → tạo bảng giá → thêm máy → bắt đầu/
  kết thúc phiên chơi → xác nhận báo cáo doanh thu cập nhật đúng.

Khác biệt với Integration Test: E2E kiểm thử cả Frontend + Backend + Database
cùng lúc, qua giao diện thật, phát hiện được cả lỗi hiển thị/UX mà test API
thuần không phát hiện được.

## 9.4 Test Coverage (Độ bao phủ kiểm thử)

Đo bằng `pytest-cov`, chạy: `pytest --cov=app --cov-report=term-missing`

| Module | Coverage |
|---|---|
| Tổng thể Backend | **94%** |
| auth.py, main.py, models.py, schemas.py, limiter.py | 100% |
| routers/reports.py | 100% |
| routers/computers.py, products.py | 94–95% |
| routers/auth.py | 94% |
| routers/users.py | 82% |
| routers/orders.py, sessions.py | 81% |
| routers/billing.py | 72% (endpoint xóa mềm bảng giá chưa test hết nhánh lỗi) |

CI/CD pipeline (`ci-cd.yml`) tự động chặn merge nếu coverage tụt dưới
**80%** (`--cov-fail-under=80`).

## Tổng số lượng test

| Loại | Số lượng | Công cụ |
|---|---|---|
| Unit Test Backend | 9 | pytest |
| Integration Test Backend | 18 | pytest + TestClient |
| Unit Test Frontend | 17 | Vitest + Testing Library |
| E2E Test | 3 kịch bản (nhiều bước/kịch bản) | Playwright |
| **Tổng cộng** | **44 test case tự động** | |

## Cách chạy toàn bộ test

```bash
# Backend (Unit + Integration + Coverage)
cd backend && TESTING=1 pytest tests/ --cov=app --cov-report=term-missing

# Frontend (Unit Test)
cd frontend && npm test

# E2E (yêu cầu hệ thống đang chạy - xem e2e/README.md)
cd e2e && npm install && npx playwright install --with-deps chromium && npm test
```
