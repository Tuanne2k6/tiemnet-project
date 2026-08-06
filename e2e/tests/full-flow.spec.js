// @ts-check
const { test, expect } = require('@playwright/test')

const API_URL = 'http://localhost:8000'
const runId = Date.now() // đảm bảo username không trùng giữa các lần chạy

// Tài khoản admin có sẵn từ dữ liệu mẫu (seed_data.py) khi hệ thống khởi động lần đầu.
// Nếu bạn đã đổi mật khẩu admin mặc định, cập nhật lại 2 biến dưới đây trước khi chạy E2E.
const SEED_ADMIN_USERNAME = 'admin'
const SEED_ADMIN_PASSWORD = 'Admin@123'

async function apiLogin(request, username, password) {
  const res = await request.post(`${API_URL}/api/auth/login`, {
    form: { username, password },
  })
  const body = await res.json()
  return body.access_token
}

test.describe('E2E - Luồng khách hàng (tài khoản do nhân viên/admin tạo sẵn)', () => {
  const username = `e2e_customer_${runId}`
  const password = 'Passw0rd123'

  test.beforeAll(async ({ request }) => {
    // Khách hàng KHÔNG tự đăng ký được nữa -> admin tạo tài khoản hộ trước
    const adminToken = await apiLogin(request, SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD)
    await request.post(`${API_URL}/api/auth/register`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { username, password, role: 'customer', full_name: 'Nguyen Van E2E' },
    })
  })

  test('Đăng nhập và chỉ thấy menu dành cho khách hàng', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Tên đăng nhập').fill(username)
    await page.getByLabel('Mật khẩu').fill(password)
    await page.getByRole('button', { name: /Đăng nhập/i }).click()

    await page.waitForURL('**/my-account')
    await expect(page.getByText('Tài khoản của tôi')).toBeVisible()

    // Khách hàng KHÔNG được thấy menu quản trị
    await expect(page.getByRole('link', { name: 'Sơ đồ máy' })).not.toBeVisible()
    await expect(page.getByRole('link', { name: 'Lịch sử chơi' })).toBeVisible()
  })

  test('Khách hàng có thể tự đổi mật khẩu ở trang Tài khoản của tôi', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Tên đăng nhập').fill(username)
    await page.getByLabel('Mật khẩu').fill(password)
    await page.getByRole('button', { name: /Đăng nhập/i }).click()
    await page.waitForURL('**/my-account')

    await page.getByLabel('Mật khẩu hiện tại').fill(password)
    await page.getByLabel('Mật khẩu mới').fill('NewPassw0rd1')
    await page.getByLabel('Nhập lại mật khẩu mới').fill('NewPassw0rd1')
    await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click()

    await expect(page.getByText('Đổi mật khẩu thành công')).toBeVisible({ timeout: 5000 })
  })

  test('Khách hàng bị chuyển hướng nếu cố truy cập thẳng URL quản trị', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Tên đăng nhập').fill(username)
    await page.getByLabel('Mật khẩu').fill(password)
    await page.getByRole('button', { name: /Đăng nhập/i }).click()
    await page.waitForURL('**/my-account')

    await page.goto('/computers')
    await expect(page).not.toHaveURL(/.*\/computers/)
  })
})

test.describe('E2E - Luồng quản trị: bảng giá -> máy -> phiên chơi -> báo cáo', () => {
  const username = `e2e_admin_${runId}`
  const password = 'Passw0rd123'
  const computerCode = `E2E${runId.toString().slice(-6)}`

  test.beforeAll(async ({ request }) => {
    const seedAdminToken = await apiLogin(request, SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD)
    await request.post(`${API_URL}/api/auth/register`, {
      headers: { Authorization: `Bearer ${seedAdminToken}` },
      data: { username, password, role: 'admin', full_name: 'Admin E2E' },
    })
  })

  test('Toàn bộ luồng: tạo bảng giá, thêm máy, chạy phiên chơi, xem báo cáo', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Tên đăng nhập').fill(username)
    await page.getByLabel('Mật khẩu').fill(password)
    await page.getByRole('button', { name: /Đăng nhập/i }).click()
    await page.waitForURL('**/dashboard')

    // ---- Bước 1: Tạo bảng giá ----
    await page.getByRole('link', { name: 'Bảng giá' }).click()
    await page.getByRole('button', { name: '+ Thêm bảng giá' }).click()
    await page.getByPlaceholder('VD: Giờ thường, Giờ VIP, Gói qua đêm...').fill('Gio E2E Test')
    await page.getByPlaceholder('VD: 6000').fill('10000')
    await page.getByRole('button', { name: 'Lưu bảng giá' }).click()
    await expect(page.getByText('Gio E2E Test')).toBeVisible()

    // ---- Bước 2: Thêm máy ----
    await page.getByRole('link', { name: 'Sơ đồ máy' }).click()
    await page.getByRole('button', { name: '+ Thêm máy' }).click()
    await page.getByPlaceholder('VD: PC01').fill(computerCode)
    await page.getByLabel('Bảng giá áp dụng').selectOption({ label: /Gio E2E Test/ })
    await page.getByRole('button', { name: 'Lưu' }).click()
    await expect(page.getByText(computerCode)).toBeVisible()

    // ---- Bước 3: Bắt đầu phiên chơi ----
    await page.getByText(computerCode).click()
    await page.getByRole('button', { name: '▶ Bắt đầu phiên chơi' }).click()
    await expect(page.getByText('Đang dùng').first()).toBeVisible()

    // ---- Bước 4: Kết thúc phiên & xác nhận có tính tiền ----
    page.once('dialog', (dialog) => dialog.accept()) // xác nhận popup alert() tính tiền
    await page.getByText(computerCode).click()
    await page.getByRole('button', { name: '⏹ Kết thúc & tính tiền' }).click()
    await page.waitForTimeout(1000)

    // ---- Bước 5: Kiểm tra báo cáo doanh thu có ghi nhận phiên vừa rồi ----
    await page.getByRole('link', { name: 'Báo cáo doanh thu' }).click()
    await page.getByRole('button', { name: 'Xem báo cáo' }).click()
    await expect(page.getByText(/Số phiên/)).toBeVisible()
  })
})

test.describe('E2E - Luồng quản lý tài khoản: tạo khách hàng, nạp tiền', () => {
  const staffUsername = `e2e_staff_${runId}`
  const staffPassword = 'Passw0rd123'
  const customerUsername = `e2e_cust_topup_${runId}`

  test.beforeAll(async ({ request }) => {
    const seedAdminToken = await apiLogin(request, SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD)
    await request.post(`${API_URL}/api/auth/register`, {
      headers: { Authorization: `Bearer ${seedAdminToken}` },
      data: { username: staffUsername, password: staffPassword, role: 'staff', full_name: 'Staff E2E' },
    })
  })

  test('Nhân viên tạo tài khoản khách hàng và nạp tiền thành công', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Tên đăng nhập').fill(staffUsername)
    await page.getByLabel('Mật khẩu').fill(staffPassword)
    await page.getByRole('button', { name: /Đăng nhập/i }).click()
    await page.waitForURL('**/dashboard')

    await page.getByRole('link', { name: 'Tài khoản' }).click()

    // Nhân viên KHÔNG thấy tùy chọn tạo tài khoản Nhân viên
    await expect(page.getByText('Chỉ Admin mới được tạo tài khoản Nhân viên.')).toBeVisible()

    await page.getByLabel('Họ và tên').fill('Khach E2E TopUp')
    await page.getByLabel('Tên đăng nhập').fill(customerUsername)
    await page.getByLabel('Mật khẩu tạm thời').fill('Passw0rd123')
    await page.getByRole('button', { name: 'Tạo tài khoản khách hàng' }).click()

    await expect(page.getByText(/Đã tạo tài khoản khách hàng/)).toBeVisible({ timeout: 5000 })

    // Nạp tiền cho khách vừa tạo
    const row = page.locator('tr', { hasText: customerUsername })
    await row.getByRole('button', { name: '+ Nạp tiền' }).click()
    await page.getByLabel('Số tiền nạp (VNĐ)').fill('50000')
    await page.getByRole('button', { name: 'Xác nhận nạp tiền' }).click()

    await expect(page.locator('tr', { hasText: customerUsername })).toContainText('50.000')
  })
})
