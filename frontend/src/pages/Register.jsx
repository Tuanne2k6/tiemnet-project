import React, { useState } from 'react'
import { Card, Form, Button, Alert } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', full_name: '', phone: '', email: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await register({ ...form, role: 'customer' })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err.response?.data?.detail || 'Đăng ký thất bại')
    }
  }

  return (
    <div className="auth-wrapper">
      <Card className="auth-card p-4">
        <Card.Body>
          <h3 className="text-center mb-4">📝 Đăng ký tài khoản khách hàng</h3>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">Đăng ký thành công! Đang chuyển đến trang đăng nhập...</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="register-fullname">
              <Form.Label>Họ và tên</Form.Label>
              <Form.Control name="full_name" onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="register-username">
              <Form.Label>Tên đăng nhập</Form.Label>
              <Form.Control name="username" onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="register-phone">
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control name="phone" onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="register-email">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="email" onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="register-password">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control type="password" name="password" onChange={handleChange} required />
            </Form.Group>
            <Button type="submit" className="btn-brand w-100">Đăng ký</Button>
          </Form>
          <div className="text-center mt-3">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}
