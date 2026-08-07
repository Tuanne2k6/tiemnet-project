import React, { useEffect, useState } from 'react'
import { Container, Table, Button, Modal, Form, Alert, Badge, Row, Col } from 'react-bootstrap'
import api from '../services/api'

export default function ProductsManage() {
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null) // sản phẩm đang sửa, null = thêm mới
  const [form, setForm] = useState({ name: '', category: 'Đồ uống', price: '', stock_quantity: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    const res = await api.get('/api/products/')
    setProducts(res.data)
  }

  useEffect(() => { load() }, [])

  const openAddModal = () => {
    setEditing(null)
    setForm({ name: '', category: 'Đồ uống', price: '', stock_quantity: '' })
    setError('')
    setShowModal(true)
  }

  const openEditModal = (product) => {
    setEditing(product)
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      stock_quantity: product.stock_quantity,
    })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.name || !form.price) {
      setError('Vui lòng nhập đầy đủ Tên sản phẩm và Giá bán')
      return
    }
    const payload = {
      name: form.name,
      category: form.category,
      price: parseFloat(form.price),
      stock_quantity: parseInt(form.stock_quantity || 0, 10),
    }
    try {
      if (editing) {
        await api.put(`/api/products/${editing.id}`, payload)
        setSuccess('Đã cập nhật sản phẩm!')
      } else {
        await api.post('/api/products/', payload)
        setSuccess('Đã thêm sản phẩm mới!')
      }
      setShowModal(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể lưu sản phẩm')
    }
  }

  const handleDeactivate = async (id) => {
    if (!window.confirm('Ẩn sản phẩm này khỏi quầy bán hàng?')) return
    try {
      await api.delete(`/api/products/${id}`)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể ẩn sản phẩm')
    }
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>🥤 Quản lý sản phẩm (đồ ăn / nước uống)</h4>
        <Button className="btn-brand" onClick={openAddModal}>+ Thêm sản phẩm</Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Table striped bordered hover responsive className="bg-white">
        <thead>
          <tr><th>Tên sản phẩm</th><th>Danh mục</th><th>Giá bán</th><th>Tồn kho</th><th>Trạng thái</th><th>Thao tác</th></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>{p.price.toLocaleString('vi-VN')}đ</td>
              <td>
                <Badge bg={p.stock_quantity > 5 ? 'success' : p.stock_quantity > 0 ? 'warning' : 'danger'}>
                  {p.stock_quantity}
                </Badge>
              </td>
              <td><Badge bg={p.is_active ? 'success' : 'secondary'}>{p.is_active ? 'Đang bán' : 'Đã ẩn'}</Badge></td>
              <td>
                <Button size="sm" className="btn-brand me-2" onClick={() => openEditModal(p)}>Sửa</Button>
                <Button size="sm" variant="outline-danger" onClick={() => handleDeactivate(p.id)}>Ẩn</Button>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr><td colSpan={6} className="text-center text-muted">Chưa có sản phẩm nào. Hãy thêm sản phẩm đầu tiên.</td></tr>
          )}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3" controlId="product-name">
            <Form.Label>Tên sản phẩm</Form.Label>
            <Form.Control
              placeholder="VD: Coca Cola, Mì tôm ly..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="product-category">
                <Form.Label>Danh mục</Form.Label>
                <Form.Select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option>Đồ uống</option>
                  <option>Đồ ăn</option>
                  <option>Snack</option>
                  <option>Thẻ giờ / Voucher</option>
                  <option>Khác</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="product-price">
                <Form.Label>Giá bán (VNĐ)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="VD: 15000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3" controlId="product-stock">
            <Form.Label>Số lượng tồn kho</Form.Label>
            <Form.Control
              type="number"
              placeholder="VD: 50"
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-brand" onClick={handleSubmit}>Lưu sản phẩm</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}
