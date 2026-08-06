import React from 'react'
import { Navbar, Nav, Container, Button } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Navbar expand="lg" className="app-navbar" variant="dark">
      <Container>
        <Navbar.Brand as={Link} to="/">🎮 Smart Net Cafe</Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            {user && (user.role === 'admin' || user.role === 'staff') && (
              <>
                <Nav.Link as={Link} to="/dashboard">Tổng quan</Nav.Link>
                <Nav.Link as={Link} to="/computers">Sơ đồ máy</Nav.Link>
                <Nav.Link as={Link} to="/pos">Bán hàng (POS)</Nav.Link>
                <Nav.Link as={Link} to="/billing-plans">Bảng giá</Nav.Link>
                <Nav.Link as={Link} to="/products">Sản phẩm</Nav.Link>
                <Nav.Link as={Link} to="/accounts">Tài khoản</Nav.Link>
                <Nav.Link as={Link} to="/bookings">Đặt chỗ</Nav.Link>
                <Nav.Link as={Link} to="/reports">Báo cáo doanh thu</Nav.Link>
              </>
            )}
            {user && user.role === 'customer' && (
              <>
                <Nav.Link as={Link} to="/my-account">Tài khoản của tôi</Nav.Link>
                <Nav.Link as={Link} to="/my-history">Lịch sử chơi</Nav.Link>
                <Nav.Link as={Link} to="/my-bookings">Đặt chỗ của tôi</Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {user ? (
              <>
                <Navbar.Text className="me-3">
                  Xin chào, <strong>{user.full_name || user.username}</strong> ({user.role})
                </Navbar.Text>
                <Button size="sm" variant="outline-light" onClick={handleLogout}>Đăng xuất</Button>
              </>
            ) : (
              <Nav.Link as={Link} to="/login">Đăng nhập</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
