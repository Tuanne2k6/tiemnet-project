import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../Login.jsx'
import { AuthProvider } from '../../context/AuthContext.jsx'

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Trang đăng nhập (Login)', () => {
  it('hiển thị đầy đủ các trường bắt buộc', () => {
    renderLogin()
    expect(screen.getByLabelText('Tên đăng nhập')).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Đăng nhập/i })).toBeInTheDocument()
  })

  it('trường tên đăng nhập và mật khẩu là bắt buộc (required)', () => {
    renderLogin()
    expect(screen.getByLabelText('Tên đăng nhập')).toBeRequired()
    expect(screen.getByLabelText('Mật khẩu')).toBeRequired()
  })

  it('trường mật khẩu phải có type="password" để ẩn ký tự', () => {
    renderLogin()
    expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute('type', 'password')
  })

  it('cho phép người dùng nhập liệu vào các trường', async () => {
    const user = userEvent.setup()
    renderLogin()
    const usernameInput = screen.getByLabelText('Tên đăng nhập')
    await user.type(usernameInput, 'admin')
    expect(usernameInput).toHaveValue('admin')
  })

  it('không còn hiển thị link tự đăng ký (chỉ Admin/Nhân viên được tạo tài khoản)', () => {
    renderLogin()
    expect(screen.queryByRole('link', { name: /Đăng ký ngay/i })).not.toBeInTheDocument()
  })
})
