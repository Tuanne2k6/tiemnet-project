# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-flow.spec.js >> E2E - Luồng khách hàng (tài khoản do nhân viên/admin tạo sẵn) >> Đăng nhập và chỉ thấy menu dành cho khách hàng
- Location: tests\full-flow.spec.js:33:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Tài khoản của tôi')
Expected: visible
Error: strict mode violation: getByText('Tài khoản của tôi') resolved to 2 elements:
    1) <a class="nav-link" href="/my-account">Tài khoản của tôi</a> aka getByRole('link', { name: 'Tài khoản của tôi' })
    2) <h4 class="mb-3">🖥️ Tài khoản của tôi</h4> aka getByRole('heading', { name: '🖥️ Tài khoản của tôi' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Tài khoản của tôi')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - generic [ref=e4]:
      - link "🎮 Smart Net Cafe" [ref=e5] [cursor=pointer]:
        - /url: /
      - generic [ref=e6]:
        - generic [ref=e7]:
          - link "Tài khoản của tôi" [ref=e8] [cursor=pointer]:
            - /url: /my-account
          - link "Lịch sử chơi" [ref=e9] [cursor=pointer]:
            - /url: /my-history
          - link "Đặt chỗ của tôi" [ref=e10] [cursor=pointer]:
            - /url: /my-bookings
        - generic [ref=e11]:
          - generic [ref=e12]:
            - text: Xin chào,
            - strong [ref=e13]: Nguyen Van E2E
            - text: (customer)
          - button "Đăng xuất" [ref=e14] [cursor=pointer]
  - generic [ref=e15]:
    - heading "🖥️ Tài khoản của tôi" [level=4] [ref=e16]
    - generic [ref=e17]:
      - generic [ref=e19]:
        - generic [ref=e20]: Chào mừng
        - heading "Nguyen Van E2E" [level=5] [ref=e21]
      - generic [ref=e23]:
        - generic [ref=e24]: Số dư tài khoản
        - heading "0đ" [level=4] [ref=e25]
      - generic [ref=e27]:
        - generic [ref=e28]: Tổng đã chi cho giờ chơi
        - heading "0đ" [level=4] [ref=e29]
    - generic [ref=e30]:
      - generic [ref=e32]:
        - heading "🔒 Đổi mật khẩu" [level=5] [ref=e33]
        - generic [ref=e34]:
          - generic [ref=e35]:
            - generic [ref=e36]: Mật khẩu hiện tại
            - textbox "Mật khẩu hiện tại" [ref=e37]
          - generic [ref=e38]:
            - generic [ref=e39]: Mật khẩu mới
            - textbox "Mật khẩu mới" [ref=e40]
            - text: Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số.
          - generic [ref=e41]:
            - generic [ref=e42]: Nhập lại mật khẩu mới
            - textbox "Nhập lại mật khẩu mới" [ref=e43]
          - button "Cập nhật mật khẩu" [ref=e44] [cursor=pointer]
      - generic [ref=e46]:
        - heading "🕹️ Lịch sử giờ chơi" [level=5] [ref=e47]
        - table [ref=e49]:
          - rowgroup [ref=e50]:
            - row [ref=e51]:
              - columnheader "Bắt đầu" [ref=e52]
              - columnheader "Kết thúc" [ref=e53]
              - columnheader "Trạng thái" [ref=e54]
              - columnheader "Thành tiền" [ref=e55]
          - rowgroup [ref=e56]:
            - row [ref=e57]:
              - cell "Chưa có lịch sử chơi" [ref=e58]
```

# Test source

```ts
  1   | // @ts-check
  2   | const { test, expect } = require('@playwright/test')
  3   | 
  4   | const API_URL = 'http://localhost:8000'
  5   | const runId = Date.now() // đảm bảo username không trùng giữa các lần chạy
  6   | 
  7   | // Tài khoản admin có sẵn từ dữ liệu mẫu (seed_data.py) khi hệ thống khởi động lần đầu.
  8   | // Nếu bạn đã đổi mật khẩu admin mặc định, cập nhật lại 2 biến dưới đây trước khi chạy E2E.
  9   | const SEED_ADMIN_USERNAME = 'admin'
  10  | const SEED_ADMIN_PASSWORD = 'Admin@123'
  11  | 
  12  | async function apiLogin(request, username, password) {
  13  |   const res = await request.post(`${API_URL}/api/auth/login`, {
  14  |     form: { username, password },
  15  |   })
  16  |   const body = await res.json()
  17  |   return body.access_token
  18  | }
  19  | 
  20  | test.describe('E2E - Luồng khách hàng (tài khoản do nhân viên/admin tạo sẵn)', () => {
  21  |   const username = `e2e_customer_${runId}`
  22  |   const password = 'Passw0rd123'
  23  | 
  24  |   test.beforeAll(async ({ request }) => {
  25  |     // Khách hàng KHÔNG tự đăng ký được nữa -> admin tạo tài khoản hộ trước
  26  |     const adminToken = await apiLogin(request, SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD)
  27  |     await request.post(`${API_URL}/api/auth/register`, {
  28  |       headers: { Authorization: `Bearer ${adminToken}` },
  29  |       data: { username, password, role: 'customer', full_name: 'Nguyen Van E2E' },
  30  |     })
  31  |   })
  32  | 
  33  |   test('Đăng nhập và chỉ thấy menu dành cho khách hàng', async ({ page }) => {
  34  |     await page.goto('/login')
  35  |     await page.getByLabel('Tên đăng nhập').fill(username)
  36  |     await page.getByLabel('Mật khẩu').fill(password)
  37  |     await page.getByRole('button', { name: /Đăng nhập/i }).click()
  38  | 
  39  |     await page.waitForURL('**/my-account')
> 40  |     await expect(page.getByText('Tài khoản của tôi')).toBeVisible()
      |                                                       ^ Error: expect(locator).toBeVisible() failed
  41  | 
  42  |     // Khách hàng KHÔNG được thấy menu quản trị
  43  |     await expect(page.getByRole('link', { name: 'Sơ đồ máy' })).not.toBeVisible()
  44  |     await expect(page.getByRole('link', { name: 'Lịch sử chơi' })).toBeVisible()
  45  |   })
  46  | 
  47  |   test('Khách hàng có thể tự đổi mật khẩu ở trang Tài khoản của tôi', async ({ page }) => {
  48  |     await page.goto('/login')
  49  |     await page.getByLabel('Tên đăng nhập').fill(username)
  50  |     await page.getByLabel('Mật khẩu').fill(password)
  51  |     await page.getByRole('button', { name: /Đăng nhập/i }).click()
  52  |     await page.waitForURL('**/my-account')
  53  | 
  54  |     await page.getByLabel('Mật khẩu hiện tại').fill(password)
  55  |     await page.getByLabel('Mật khẩu mới').fill('NewPassw0rd1')
  56  |     await page.getByLabel('Nhập lại mật khẩu mới').fill('NewPassw0rd1')
  57  |     await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click()
  58  | 
  59  |     await expect(page.getByText('Đổi mật khẩu thành công')).toBeVisible({ timeout: 5000 })
  60  |   })
  61  | 
  62  |   test('Khách hàng bị chuyển hướng nếu cố truy cập thẳng URL quản trị', async ({ page }) => {
  63  |     await page.goto('/login')
  64  |     await page.getByLabel('Tên đăng nhập').fill(username)
  65  |     await page.getByLabel('Mật khẩu').fill(password)
  66  |     await page.getByRole('button', { name: /Đăng nhập/i }).click()
  67  |     await page.waitForURL('**/my-account')
  68  | 
  69  |     await page.goto('/computers')
  70  |     await expect(page).not.toHaveURL(/.*\/computers/)
  71  |   })
  72  | })
  73  | 
  74  | test.describe('E2E - Luồng quản trị: bảng giá -> máy -> phiên chơi -> báo cáo', () => {
  75  |   const username = `e2e_admin_${runId}`
  76  |   const password = 'Passw0rd123'
  77  |   const computerCode = `E2E${runId.toString().slice(-6)}`
  78  | 
  79  |   test.beforeAll(async ({ request }) => {
  80  |     const seedAdminToken = await apiLogin(request, SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD)
  81  |     await request.post(`${API_URL}/api/auth/register`, {
  82  |       headers: { Authorization: `Bearer ${seedAdminToken}` },
  83  |       data: { username, password, role: 'admin', full_name: 'Admin E2E' },
  84  |     })
  85  |   })
  86  | 
  87  |   test('Toàn bộ luồng: tạo bảng giá, thêm máy, chạy phiên chơi, xem báo cáo', async ({ page }) => {
  88  |     await page.goto('/login')
  89  |     await page.getByLabel('Tên đăng nhập').fill(username)
  90  |     await page.getByLabel('Mật khẩu').fill(password)
  91  |     await page.getByRole('button', { name: /Đăng nhập/i }).click()
  92  |     await page.waitForURL('**/dashboard')
  93  | 
  94  |     // ---- Bước 1: Tạo bảng giá ----
  95  |     await page.getByRole('link', { name: 'Bảng giá' }).click()
  96  |     await page.getByRole('button', { name: '+ Thêm bảng giá' }).click()
  97  |     await page.getByPlaceholder('VD: Giờ thường, Giờ VIP, Gói qua đêm...').fill('Gio E2E Test')
  98  |     await page.getByPlaceholder('VD: 6000').fill('10000')
  99  |     await page.getByRole('button', { name: 'Lưu bảng giá' }).click()
  100 |     await expect(page.getByText('Gio E2E Test')).toBeVisible()
  101 | 
  102 |     // ---- Bước 2: Thêm máy ----
  103 |     await page.getByRole('link', { name: 'Sơ đồ máy' }).click()
  104 |     await page.getByRole('button', { name: '+ Thêm máy' }).click()
  105 |     await page.getByPlaceholder('VD: PC01').fill(computerCode)
  106 |     await page.getByLabel('Bảng giá áp dụng').selectOption({ label: /Gio E2E Test/ })
  107 |     await page.getByRole('button', { name: 'Lưu' }).click()
  108 |     await expect(page.getByText(computerCode)).toBeVisible()
  109 | 
  110 |     // ---- Bước 3: Bắt đầu phiên chơi ----
  111 |     await page.getByText(computerCode).click()
  112 |     await page.getByRole('button', { name: '▶ Bắt đầu phiên chơi' }).click()
  113 |     await expect(page.getByText('Đang dùng').first()).toBeVisible()
  114 | 
  115 |     // ---- Bước 4: Kết thúc phiên & xác nhận có tính tiền ----
  116 |     page.once('dialog', (dialog) => dialog.accept()) // xác nhận popup alert() tính tiền
  117 |     await page.getByText(computerCode).click()
  118 |     await page.getByRole('button', { name: '⏹ Kết thúc & tính tiền' }).click()
  119 |     await page.waitForTimeout(1000)
  120 | 
  121 |     // ---- Bước 5: Kiểm tra báo cáo doanh thu có ghi nhận phiên vừa rồi ----
  122 |     await page.getByRole('link', { name: 'Báo cáo doanh thu' }).click()
  123 |     await page.getByRole('button', { name: 'Xem báo cáo' }).click()
  124 |     await expect(page.getByText(/Số phiên/)).toBeVisible()
  125 |   })
  126 | })
  127 | 
  128 | test.describe('E2E - Luồng quản lý tài khoản: tạo khách hàng, nạp tiền', () => {
  129 |   const staffUsername = `e2e_staff_${runId}`
  130 |   const staffPassword = 'Passw0rd123'
  131 |   const customerUsername = `e2e_cust_topup_${runId}`
  132 | 
  133 |   test.beforeAll(async ({ request }) => {
  134 |     const seedAdminToken = await apiLogin(request, SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD)
  135 |     await request.post(`${API_URL}/api/auth/register`, {
  136 |       headers: { Authorization: `Bearer ${seedAdminToken}` },
  137 |       data: { username: staffUsername, password: staffPassword, role: 'staff', full_name: 'Staff E2E' },
  138 |     })
  139 |   })
  140 | 
```