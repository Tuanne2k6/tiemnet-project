import React, { useEffect, useState } from 'react'
import { Container, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap'
import api from '../services/api'

export default function BillingPlans() {
  const [plans, setPlans] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', price_per_hour: '', description: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    const res = await api.get('/api/billing-plans/')
    setPlans(res.data)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    setError(''); setSuccess('')
    if (!form.name || !form.price_per_hour) {
      setError('Vui lòng nhập đầy đủ Tên bảng giá và Giá/giờ')
      return
    }
    try {
      await api.post('/api/billing-plans/', {
        name: form.name,
        price_per_hour: parseFloat(form.price_per_hour),
        description: form.description,
      })
      setSuccess('Đã thêm bảng giá thành công!')
      setForm({ name: '', price_per_hour: '', description: '' })
      setShowModal(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể thêm bảng giá')
    }
  }

  const handleDeactivate = async (id) => {
    if (!window.confirm('Ngừng sử dụng bảng giá này?')) return
    try {
      await api.delete(`/api/billing-plans/${id}`)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể xóa bảng giá')
    }
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>💵 Quản lý bảng giá</h4>
        <Button className="btn-brand" onClick={() => setShowModal(true)}>+ Thêm bảng giá</Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Table striped bordered hover responsive className="bg-white">
        <thead>
          <tr><th>Tên bảng giá</th><th>Giá / giờ</th><th>Mô tả</th><th>Trạng thái</th><th>Thao tác</th></tr>
        </thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.price_per_hour.toLocaleString()}đ</td>
              <td>{p.description || '-'}</td>
              <td><Badge bg={p.is_active ? 'success' : 'secondary'}>{p.is_active ? 'Đang dùng' : 'Ngừng dùng'}</Badge></td>
              <td>
                <Button size="sm" variant="outline-danger" onClick={() => handleDeactivate(p.id)}>Ngừng dùng</Button>
              </td>
            </tr>
          ))}
          {plans.length === 0 && (
            <tr><td colSpan={5} className="text-center text-muted">Chưa có bảng giá nào. Hãy thêm bảng giá đầu tiên (VD: Giờ thường - 6.000đ/giờ)</td></tr>
          )}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Thêm bảng giá mới</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3" controlId="billing-name">
            <Form.Label>Tên bảng giá</Form.Label>
            <Form.Control
              placeholder="VD: Giờ thường, Giờ VIP, Gói qua đêm..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="billing-price">
            <Form.Label>Giá mỗi giờ (VNĐ)</Form.Label>
            <Form.Control
              type="number"
              placeholder="VD: 6000"
              value={form.price_per_hour}
              onChange={(e) => setForm({ ...form, price_per_hour: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="billing-description">
            <Form.Label>Mô tả (không bắt buộc)</Form.Label>
            <Form.Control
              placeholder="VD: Áp dụng cho khu vực thường"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-brand" onClick={handleSubmit}>Lưu bảng giá</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}
