/**
 * Định dạng số tiền theo chuẩn Việt Nam (VD: 15000 -> "15.000đ").
 * Tách thành hàm thuần (pure function) để dễ viết Unit Test (Chương 9.1).
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return '0đ'
  }
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`
}

/**
 * Tính số tiền phải trả theo giờ chơi, làm tròn lên theo mốc 15 phút,
 * tối thiểu tính phí 15 phút (đồng bộ với logic backend `sessions.py`).
 * @param {number} durationMinutes - thời gian chơi thực tế (phút)
 * @param {number} pricePerHour - đơn giá mỗi giờ (VNĐ)
 */
export function calculateSessionFee(durationMinutes, pricePerHour) {
  if (durationMinutes <= 0 || pricePerHour <= 0) return 0
  const hours = durationMinutes / 60
  const billedHours = Math.max(0.25, Math.round(hours * 4) / 4)
  return Math.round(billedHours * pricePerHour)
}
