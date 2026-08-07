import React, { useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Table } from 'react-bootstrap'
import api from '../services/api'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function Reports() {
  const [fromDate, setFromDate] = useState(todayStr())
  const [toDate, setToDate] = useState(todayStr())
  const [report, setReport] = useState(null)
  const [usage, setUsage] = useState([])

  const loadReport = async () => {
    const res = await api.get('/api/reports/revenue', { params: { from_date: fromDate, to_date: toDate } })
    setReport(res.data)
    const usageRes = await api.get('/api/reports/computer-usage')
    setUsage(usageRes.data)
  }

  return (
    <Container className="py-4">
      <h4 className="mb-3">📊 Báo cáo doanh thu</h4>
      <Card className="card-stat mb-4">
        <Row className="g-3 align-items-end">
          <Col md={4}>
            <Form.Label>Từ ngày</Form.Label>
            <Form.Control type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </Col>
          <Col md={4}>
            <Form.Label>Đến ngày</Form.Label>
            <Form.Control type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </Col>
          <Col md={4}>
            <Button className="btn-brand w-100" onClick={loadReport}>Xem báo cáo</Button>
          </Col>
        </Row>
      </Card>

      {report && (
        <Row className="g-3 mb-4">
          <Col md={3}>
            <Card className="card-stat text-center">
              <small className="text-muted">Doanh thu giờ chơi</small>
              <h4>{report.total_session_revenue.toLocaleString('vi-VN')}đ</h4>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="card-stat text-center">
              <small className="text-muted">Doanh thu POS</small>
              <h4>{report.total_product_revenue.toLocaleString('vi-VN')}đ</h4>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="card-stat text-center">
              <small className="text-muted">Tổng doanh thu</small>
              <h4 className="text-success">{report.total_revenue.toLocaleString('vi-VN')}đ</h4>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="card-stat text-center">
              <small className="text-muted">Số phiên / đơn hàng</small>
              <h4>{report.total_sessions} / {report.total_orders}</h4>
            </Card>
          </Col>
        </Row>
      )}

      {usage.length > 0 && (
        <>
          <h5>Mức độ sử dụng theo máy</h5>
          <Table striped bordered hover responsive className="bg-white">
            <thead><tr><th>Mã máy</th><th>Tổng số phiên</th><th>Tổng doanh thu</th></tr></thead>
            <tbody>
              {usage.map((u) => (
                <tr key={u.computer_code}>
                  <td>{u.computer_code}</td>
                  <td>{u.total_sessions}</td>
                  <td>{u.total_revenue.toLocaleString('vi-VN')}đ</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </Container>
  )
}
