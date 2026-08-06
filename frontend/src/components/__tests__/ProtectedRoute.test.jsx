import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute.jsx'

// Mock module useAuth để kiểm soát trạng thái đăng nhập trong từng test case
vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../context/AuthContext.jsx'

function renderWithRoute(initialPath, allowedRoles) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Nội dung được bảo vệ</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Trang đăng nhập</div>} />
        <Route path="/" element={<div>Trang chủ</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute (RBAC ở tầng Frontend)', () => {
  it('chuyển hướng về /login nếu chưa đăng nhập', () => {
    useAuth.mockReturnValue({ user: null })
    renderWithRoute('/protected', ['admin'])
    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument()
  })

  it('chuyển hướng về / nếu vai trò không được phép truy cập', () => {
    useAuth.mockReturnValue({ user: { role: 'customer' } })
    renderWithRoute('/protected', ['admin', 'staff'])
    expect(screen.getByText('Trang chủ')).toBeInTheDocument()
  })

  it('hiển thị nội dung nếu vai trò được phép truy cập', () => {
    useAuth.mockReturnValue({ user: { role: 'admin' } })
    renderWithRoute('/protected', ['admin', 'staff'])
    expect(screen.getByText('Nội dung được bảo vệ')).toBeInTheDocument()
  })

  it('cho phép truy cập nếu không giới hạn allowedRoles', () => {
    useAuth.mockReturnValue({ user: { role: 'customer' } })
    renderWithRoute('/protected', undefined)
    expect(screen.getByText('Nội dung được bảo vệ')).toBeInTheDocument()
  })
})
