import { describe, it, expect } from 'vitest'
import { formatCurrency, calculateSessionFee } from '../format.js'

describe('formatCurrency', () => {
  it('định dạng số tiền thông thường', () => {
    expect(formatCurrency(15000)).toBe('15.000đ')
  })

  it('làm tròn số thập phân', () => {
    expect(formatCurrency(1999.6)).toBe('2.000đ')
  })

  it('trả về 0đ khi giá trị null/undefined/NaN', () => {
    expect(formatCurrency(null)).toBe('0đ')
    expect(formatCurrency(undefined)).toBe('0đ')
    expect(formatCurrency(NaN)).toBe('0đ')
  })

  it('xử lý số 0', () => {
    expect(formatCurrency(0)).toBe('0đ')
  })
})

describe('calculateSessionFee', () => {
  it('tính đúng phí cho 1 giờ chơi tròn', () => {
    expect(calculateSessionFee(60, 10000)).toBe(10000)
  })

  it('áp dụng mức tối thiểu 15 phút cho phiên chơi rất ngắn', () => {
    // Chơi 2 phút vẫn tính tối thiểu 15 phút = 0.25 giờ
    expect(calculateSessionFee(2, 10000)).toBe(2500)
  })

  it('làm tròn lên theo mốc 15 phút', () => {
    // 40 phút -> làm tròn lên mốc gần nhất (45 phút = 0.75 giờ)
    expect(calculateSessionFee(40, 8000)).toBe(6000)
  })

  it('trả về 0 nếu thời lượng hoặc đơn giá không hợp lệ', () => {
    expect(calculateSessionFee(0, 10000)).toBe(0)
    expect(calculateSessionFee(30, 0)).toBe(0)
    expect(calculateSessionFee(-5, 10000)).toBe(0)
  })
})
