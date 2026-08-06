// @ts-check
const { defineConfig, devices } = require('@playwright/test')

/**
 * Chương 9.3 - End-to-End Test:
 * Yêu cầu Frontend (http://localhost:5173) và Backend (http://localhost:8000)
 * đang chạy trước khi chạy bộ test này (chạy thủ công hoặc bằng Docker Compose).
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  fullyParallel: false, // chạy tuần tự vì các test dùng chung 1 database
  retries: 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
