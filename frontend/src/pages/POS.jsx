import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button, ListGroup, Alert, Badge } from 'react-bootstrap'
import api from '../services/api'

export default function POS() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([]) // {product, quantity}
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/products/').then((res) => setProducts(res.data))
  }, [])

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId))
  }

  const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  const handleCheckout = async () => {
    setError('')
    if (cart.length === 0) return
    try {
      const res = await api.post('/api/orders/', {
        items: cart.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      })
      setMessage(`✅ Thanh toán thành công! Tổng: ${res.data.total_amount.toLocaleString()}đ`)
      setCart([])
      const refreshed = await api.get('/api/products/')
      setProducts(refreshed.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể tạo đơn hàng')
    }
  }

  return (
    <Container className="py-4">
      <h4 className="mb-3">🛒 Bán hàng tại quầy (POS)</h4>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
      <Row>
        <Col md={8}>
          <Row xs={2} md={3} className="g-3">
            {products.map((p) => (
              <Col key={p.id}>
                <Card className="card-stat h-100" role="button" onClick={() => addToCart(p)}>
                  <Card.Body>
                    <Card.Title style={{ fontSize: '1rem' }}>{p.name}</Card.Title>
                    <Card.Text className="text-muted small">{p.category}</Card.Text>
                    <div className="d-flex justify-content-between">
                      <strong>{p.price.toLocaleString()}đ</strong>
                      <Badge bg={p.stock_quantity > 0 ? 'success' : 'danger'}>
                        Tồn: {p.stock_quantity}
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
        <Col md={4}>
          <Card className="card-stat">
            <h5>Hóa đơn</h5>
            <ListGroup variant="flush">
              {cart.map((i) => (
                <ListGroup.Item key={i.product.id} className="d-flex justify-content-between align-items-center">
                  <span>{i.product.name} x{i.quantity}</span>
                  <div>
                    <strong className="me-2">{(i.product.price * i.quantity).toLocaleString()}đ</strong>
                    <Button size="sm" variant="outline-danger" onClick={() => removeFromCart(i.product.id)}>x</Button>
                  </div>
                </ListGroup.Item>
              ))}
              {cart.length === 0 && <p className="text-muted mt-2">Chưa có sản phẩm nào</p>}
            </ListGroup>
            <hr />
            <div className="d-flex justify-content-between mb-3">
              <strong>Tổng cộng</strong>
              <strong>{total.toLocaleString()}đ</strong>
            </div>
            <Button className="btn-brand w-100" onClick={handleCheckout} disabled={cart.length === 0}>
              Thanh toán
            </Button>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
