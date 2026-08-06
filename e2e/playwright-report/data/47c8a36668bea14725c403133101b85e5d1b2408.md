# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-flow.spec.js >> E2E - Luồng quản lý tài khoản: tạo khách hàng, nạp tiền >> Nhân viên tạo tài khoản khách hàng và nạp tiền thành công
- Location: tests\full-flow.spec.js:141:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Đã tạo tài khoản khách hàng/)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/Đã tạo tài khoản khách hàng/)

```

# Test source

```ts
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
  141 |   test('Nhân viên tạo tài khoản khách hàng và nạp tiền thành công', async ({ page }) => {
  142 |     await page.goto('/login')
  143 |     await page.getByLabel('Tên đăng nhập').fill(staffUsername)
  144 |     await page.getByLabel('Mật khẩu').fill(staffPassword)
  145 |     await page.getByRole('button', { name: /Đăng nhập/i }).click()
  146 |     await page.waitForURL('**/dashboard')
  147 | 
  148 |     await page.getByRole('link', { name: 'Tài khoản' }).click()
  149 | 
  150 |     // Nhân viên KHÔNG thấy tùy chọn tạo tài khoản Nhân viên
  151 |     await expect(page.getByText('Chỉ Admin mới được tạo tài khoản Nhân viên.')).toBeVisible()
  152 | 
  153 |     await page.getByLabel('Họ và tên').fill('Khach E2E TopUp')
  154 |     await page.getByLabel('Tên đăng nhập').fill(customerUsername)
  155 |     await page.getByLabel('Mật khẩu tạm thời').fill('Passw0rd123')
  156 |     await page.getByRole('button', { name: 'Tạo tài khoản khách hàng' }).click()
  157 | 
> 158 |     await expect(page.getByText(/Đã tạo tài khoản khách hàng/)).toBeVisible({ timeout: 5000 })
      |                                                                 ^ Error: expect(locator).toBeVisible() failed
  159 | 
  160 |     // Nạp tiền cho khách vừa tạo
  161 |     const row = page.locator('tr', { hasText: customerUsername })
  162 |     await row.getByRole('button', { name: '+ Nạp tiền' }).click()
  163 |     await page.getByLabel('Số tiền nạp (VNĐ)').fill('50000')
  164 |     await page.getByRole('button', { name: 'Xác nhận nạp tiền' }).click()
  165 | 
  166 |     await expect(page.locator('tr', { hasText: customerUsername })).toContainText('50.000')
  167 |   })
  168 | })
  169 | 
```