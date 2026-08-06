import React, { useEffect, useState } from 'react'
import { Form, Button, Alert } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [clock, setClock] = useState(new Date())
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(username, password)
      if (user.role === 'admin' || user.role === 'staff') {
        navigate('/dashboard')
      } else {
        navigate('/my-account')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Đăng nhập thất bại, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="monitor-shell">
        <div className="monitor-frame">
          <div className="monitor-topbar">
            <div className="monitor-dots"><span /><span /><span /></div>
            <div className="monitor-label">
              PC-CAFE &nbsp;•&nbsp; {clock.toLocaleTimeString('vi-VN')}
            </div>
          </div>

          <div className="monitor-screen">
            <div className="monitor-boot-icon">🖥️</div>
            <h4 className="text-center mb-1">Smart Net Cafe</h4>
            <p className="text-center text-muted mb-4" style={{ fontSize: 13 }}>
              Đăng nhập vào tài khoản của bạn để bắt đầu sử dụng máy
            </p>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="login-username">
                <Form.Label>Tên đăng nhập</Form.Label>
                <Form.Control
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="login-password">
                <Form.Label>Mật khẩu</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                />
              </Form.Group>
              <Button type="submit" className="btn-brand w-100" disabled={loading}>
                {loading ? 'Đang đăng nhập...' : '▶ Đăng nhập'}
              </Button>
            </Form>

            <p className="text-center text-muted mt-4 mb-0" style={{ fontSize: 12 }}>
              Chưa có tài khoản? Vui lòng liên hệ nhân viên quầy để được tạo tài khoản.
            </p>
          </div>
        </div>
        <div className="monitor-stand" />
        <div className="monitor-base" />
      </div>
    </div>
  )
}
