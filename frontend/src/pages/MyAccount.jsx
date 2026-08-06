import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Table, Badge, Alert } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api'

export default function MyAccount() {
  const { user } = useAuth()
  const [balance, setBalance] = useState(user?.balance ?? 0)
  const [sessions, setSessions] = useState([])

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  const loadData = async () => {
    const [meRes, sessionsRes] = await Promise.all([
      api.get('/api/auth/me'),
      api.get('/api/sessions/my-history'),
    ])
    setBalance(meRes.data.balance)
    setSessions(sessionsRes.data)
  }

  useEffect(() => { loadData() }, [])

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwError(''); setPwSuccess('')
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('Mật khẩu mới nhập lại không khớp')
      return
    }
    try {
      await api.put('/api/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      })
      setPwSuccess('Đổi mật khẩu thành công!')
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setPwError(err.response?.data?.detail || 'Không thể đổi mật khẩu')
    }
  }

  const totalSpent = sessions
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + s.total_amount, 0)

  return (
    <Container className="py-4">
      <h4 className="mb-3">🖥️ Tài khoản của tôi</h4>

      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="card-stat text-center">
            <small className="text-muted">Chào mừng</small>
            <h5 className="mb-0">{user?.full_name || user?.username}</h5>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="card-stat text-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff' }}>
            <small style={{ opacity: 0.85 }}>Số dư tài khoản</small>
            <h4>{balance.toLocaleString()}đ</h4>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="card-stat text-center">
            <small className="text-muted">Tổng đã chi cho giờ chơi</small>
            <h4>{totalSpent.toLocaleString()}đ</h4>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col md={5}>
          <Card className="card-stat">
            <h5 className="mb-3">🔒 Đổi mật khẩu</h5>
            {pwError && <Alert variant="danger">{pwError}</Alert>}
            {pwSuccess && <Alert variant="success" onClose={() => setPwSuccess('')} dismissible>{pwSuccess}</Alert>}
            <Form onSubmit={handleChangePassword}>
              <Form.Group className="mb-3" controlId="pw-current">
                <Form.Label>Mật khẩu hiện tại</Form.Label>
                <Form.Control
                  type="password"
                  value={pwForm.current_password}
                  onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="pw-new">
                <Form.Label>Mật khẩu mới</Form.Label>
                <Form.Control
                  type="password"
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                  required
                />
                <Form.Text className="text-muted">
                  Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số.
                </Form.Text>
              </Form.Group>
              <Form.Group className="mb-3" controlId="pw-confirm">
                <Form.Label>Nhập lại mật khẩu mới</Form.Label>
                <Form.Control
                  type="password"
                  value={pwForm.confirm_password}
                  onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                  required
                />
              </Form.Group>
              <Button type="submit" className="btn-brand w-100">Cập nhật mật khẩu</Button>
            </Form>
          </Card>
        </Col>

        <Col md={7}>
          <Card className="card-stat">
            <h5 className="mb-3">🕹️ Lịch sử giờ chơi</h5>
            <Table striped bordered hover responsive className="bg-white">
              <thead>
                <tr><th>Bắt đầu</th><th>Kết thúc</th><th>Trạng thái</th><th>Thành tiền</th></tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td>{new Date(s.start_time).toLocaleString('vi-VN')}</td>
                    <td>{s.end_time ? new Date(s.end_time).toLocaleString('vi-VN') : '-'}</td>
                    <td><Badge bg={s.status === 'active' ? 'warning' : 'success'}>{s.status}</Badge></td>
                    <td>{s.total_amount.toLocaleString()}đ</td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-muted">Chưa có lịch sử chơi</td></tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
