import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Table, Badge, Alert, Modal } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api'

export default function Accounts() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [form, setForm] = useState({
    username: '', password: '', full_name: '', phone: '', email: '', role: 'customer',
  })
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')

  const [customers, setCustomers] = useState([])
  const [listError, setListError] = useState('')

  const [topUpTarget, setTopUpTarget] = useState(null)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [topUpError, setTopUpError] = useState('')

  const loadCustomers = async () => {
    try {
      const res = await api.get('/api/users/', { params: { role: 'customer' } })
      setCustomers(res.data)
    } catch (err) {
      setListError('Không thể tải danh sách khách hàng')
    }
  }

  useEffect(() => { loadCustomers() }, [])

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setCreateError(''); setCreateSuccess('')
    try {
      await api.post('/api/auth/register', form)
      setCreateSuccess(
        form.role === 'staff'
          ? `Đã tạo tài khoản nhân viên "${form.username}" thành công!`
          : `Đã tạo tài khoản khách hàng "${form.username}" thành công!`
      )
      setForm({ username: '', password: '', full_name: '', phone: '', email: '', role: 'customer' })
      loadCustomers()
    } catch (err) {
      setCreateError(err.response?.data?.detail || 'Không thể tạo tài khoản')
    }
  }

  const openTopUp = (customer) => {
    setTopUpTarget(customer)
    setTopUpAmount('')
    setTopUpError('')
  }

  const handleTopUp = async () => {
    setTopUpError('')
    const amount = parseFloat(topUpAmount)
    if (!amount || amount <= 0) {
      setTopUpError('Vui lòng nhập số tiền hợp lệ')
      return
    }
    try {
      await api.post(`/api/users/${topUpTarget.id}/topup`, { amount })
      setTopUpTarget(null)
      loadCustomers()
    } catch (err) {
      setTopUpError(err.response?.data?.detail || 'Không thể nạp tiền')
    }
  }

  return (
    <Container className="py-4">
      <h4 className="mb-3">👤 Quản lý tài khoản</h4>

      <Row className="g-4">
        <Col md={5}>
          <Card className="card-stat">
            <h5 className="mb-3">Tạo tài khoản mới</h5>
            {createError && <Alert variant="danger">{createError}</Alert>}
            {createSuccess && <Alert variant="success" onClose={() => setCreateSuccess('')} dismissible>{createSuccess}</Alert>}
            <Form onSubmit={handleCreateSubmit}>
              <Form.Group className="mb-3" controlId="acc-role">
                <Form.Label>Loại tài khoản</Form.Label>
                <Form.Select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="customer">Khách hàng</option>
                  {isAdmin && <option value="staff">Nhân viên</option>}
                </Form.Select>
                {!isAdmin && (
                  <Form.Text className="text-muted">
                    Chỉ Admin mới được tạo tài khoản Nhân viên.
                  </Form.Text>
                )}
              </Form.Group>
              <Form.Group className="mb-3" controlId="acc-fullname">
                <Form.Label>Họ và tên</Form.Label>
                <Form.Control
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="acc-username">
                <Form.Label>Tên đăng nhập</Form.Label>
                <Form.Control
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="acc-phone">
                <Form.Label>Số điện thoại</Form.Label>
                <Form.Control
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="acc-password">
                <Form.Label>Mật khẩu tạm thời</Form.Label>
                <Form.Control
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <Form.Text className="text-muted">
                  Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số.
                </Form.Text>
              </Form.Group>
              <Button type="submit" className="btn-brand w-100">
                {form.role === 'staff' ? 'Tạo tài khoản nhân viên' : 'Tạo tài khoản khách hàng'}
              </Button>
            </Form>
          </Card>
        </Col>

        <Col md={7}>
          <Card className="card-stat">
            <h5 className="mb-3">Danh sách khách hàng & số dư</h5>
            {listError && <Alert variant="danger">{listError}</Alert>}
            <Table striped bordered hover responsive className="bg-white">
              <thead>
                <tr><th>Tên đăng nhập</th><th>Họ tên</th><th>Số dư</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.username}</td>
                    <td>{c.full_name || '-'}</td>
                    <td>
                      <Badge bg={c.balance > 0 ? 'success' : 'secondary'}>
                        {c.balance.toLocaleString()}đ
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={c.is_active ? 'success' : 'danger'}>{c.is_active ? 'Hoạt động' : 'Đã khóa'}</Badge>
                    </td>
                    <td>
                      <Button size="sm" className="btn-brand" onClick={() => openTopUp(c)}>+ Nạp tiền</Button>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted">Chưa có khách hàng nào</td></tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>

      <Modal show={!!topUpTarget} onHide={() => setTopUpTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Nạp tiền cho {topUpTarget?.username}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {topUpError && <Alert variant="danger">{topUpError}</Alert>}
          <p>Số dư hiện tại: <strong>{topUpTarget?.balance.toLocaleString()}đ</strong></p>
          <Form.Group controlId="topup-amount">
            <Form.Label>Số tiền nạp (VNĐ)</Form.Label>
            <Form.Control
              type="number"
              placeholder="VD: 50000"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-brand" onClick={handleTopUp}>Xác nhận nạp tiền</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}
