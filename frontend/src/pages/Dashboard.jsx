import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import api from '../services/api'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [computers, setComputers] = useState([])
  const [revenue, setRevenue] = useState(null)
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const today = todayStr()
        const [computersRes, revenueRes, bookingsRes] = await Promise.all([
          api.get('/api/computers/'),
          api.get('/api/reports/revenue', { params: { from_date: today, to_date: today } }),
          api.get('/api/bookings/'),
        ])
        setComputers(computersRes.data)
        setRevenue(revenueRes.data)
        setBookings(bookingsRes.data.filter((b) => b.status === 'pending'))
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 20000)
    return () => clearInterval(interval)
  }, [])

  const available = computers.filter((c) => c.status === 'available').length
  const inUse = computers.filter((c) => c.status === 'in_use').length
  const maintenance = computers.filter((c) => c.status === 'maintenance').length

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    )
  }

  return (
    <Container className="py-4">
      <h4 className="mb-4">📊 Tổng quan hệ thống hôm nay</h4>

      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="card-stat h-100 border-start border-4 border-success">
            <small className="text-muted">Máy trống</small>
            <h2 className="mb-0">{available}</h2>
            <small className="text-muted">/ {computers.length} máy</small>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-stat h-100 border-start border-4" style={{ borderColor: '#f97316' }}>
            <small className="text-muted">Đang sử dụng</small>
            <h2 className="mb-0">{inUse}</h2>
            <small className="text-muted">máy đang chơi</small>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-stat h-100 border-start border-4 border-secondary">
            <small className="text-muted">Bảo trì</small>
            <h2 className="mb-0">{maintenance}</h2>
            <small className="text-muted">máy tạm ngừng</small>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-stat h-100 border-start border-4 border-primary">
            <small className="text-muted">Đặt chỗ chờ xử lý</small>
            <h2 className="mb-0">{bookings.length}</h2>
            <small className="text-muted">yêu cầu mới</small>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="card-stat text-center">
            <small className="text-muted">Doanh thu giờ chơi hôm nay</small>
            <h3 className="text-primary">{revenue.total_session_revenue.toLocaleString()}đ</h3>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="card-stat text-center">
            <small className="text-muted">Doanh thu POS hôm nay</small>
            <h3 className="text-primary">{revenue.total_product_revenue.toLocaleString()}đ</h3>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="card-stat text-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff' }}>
            <small style={{ opacity: 0.85 }}>Tổng doanh thu hôm nay</small>
            <h3>{revenue.total_revenue.toLocaleString()}đ</h3>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        <Col md={3}>
          <Link to="/computers" className="text-decoration-none">
            <Card className="card-stat text-center h-100" role="button">
              <div style={{ fontSize: '1.8rem' }}>🖥️</div>
              <strong>Sơ đồ máy</strong>
            </Card>
          </Link>
        </Col>
        <Col md={3}>
          <Link to="/pos" className="text-decoration-none">
            <Card className="card-stat text-center h-100" role="button">
              <div style={{ fontSize: '1.8rem' }}>🛒</div>
              <strong>Bán hàng POS</strong>
            </Card>
          </Link>
        </Col>
        <Col md={3}>
          <Link to="/billing-plans" className="text-decoration-none">
            <Card className="card-stat text-center h-100" role="button">
              <div style={{ fontSize: '1.8rem' }}>💵</div>
              <strong>Bảng giá</strong>
            </Card>
          </Link>
        </Col>
        <Col md={3}>
          <Link to="/products" className="text-decoration-none">
            <Card className="card-stat text-center h-100" role="button">
              <div style={{ fontSize: '1.8rem' }}>🥤</div>
              <strong>Sản phẩm</strong>
            </Card>
          </Link>
        </Col>
      </Row>

      {bookings.length > 0 && (
        <Card className="card-stat mt-4">
          <h5>🔔 Đặt chỗ đang chờ xác nhận</h5>
          {bookings.slice(0, 5).map((b) => (
            <div key={b.id} className="d-flex justify-content-between border-bottom py-2">
              <span>Khách #{b.customer_id} - {new Date(b.booking_time).toLocaleString('vi-VN')}</span>
              <Badge bg="warning" text="dark">Chờ xử lý</Badge>
            </div>
          ))}
          <Link to="/bookings" className="d-block mt-2">Xem tất cả →</Link>
        </Card>
      )}
    </Container>
  )
}
