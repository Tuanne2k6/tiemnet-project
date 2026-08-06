import React from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext.jsx'

export default function Home() {
  const { user } = useAuth()
  return (
    <Container className="py-5">
      <div className="text-center mb-5">
        <h1>🎮 Hệ Thống Quản Lý Tiệm Net</h1>
        <p className="text-muted">Quản lý máy tính, giờ chơi, bán hàng và đặt chỗ - tất cả trong một nền tảng</p>
      </div>
      <Row className="g-4">
        <Col md={3}>
          <Card className="card-stat text-center h-100">
            <h5>🖥️ Quản lý máy</h5>
            <p className="text-muted mb-0">Theo dõi trạng thái máy theo thời gian thực</p>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-stat text-center h-100">
            <h5>💰 Tính giờ tự động</h5>
            <p className="text-muted mb-0">Tự động tính tiền theo bảng giá khi kết thúc phiên</p>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-stat text-center h-100">
            <h5>🛒 Bán hàng POS</h5>
            <p className="text-muted mb-0">Bán đồ ăn, nước uống nhanh chóng tại quầy</p>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-stat text-center h-100">
            <h5>📊 Báo cáo doanh thu</h5>
            <p className="text-muted mb-0">Thống kê doanh thu theo ngày, theo máy</p>
          </Card>
        </Col>
      </Row>
      {!user && <p className="text-center mt-5 text-muted">Vui lòng đăng nhập để sử dụng hệ thống.</p>}
    </Container>
  )
}
