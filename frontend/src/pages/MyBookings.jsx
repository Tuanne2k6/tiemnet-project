import React, { useEffect, useState } from 'react'
import { Container, Form, Button, Table, Badge, Alert, Card } from 'react-bootstrap'
import api from '../services/api'

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [form, setForm] = useState({ booking_time: '', duration_minutes: 60, zone_preference: 'Thường', note: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    const res = await api.get('/api/bookings/my-bookings')
    setBookings(res.data)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      await api.post('/api/bookings/', form)
      setSuccess('Đặt chỗ thành công! Nhân viên sẽ xác nhận sớm.')
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Đặt chỗ thất bại')
    }
  }

  return (
    <Container className="py-4">
      <h4 className="mb-3">📅 Đặt chỗ trước</h4>
      <Card className="card-stat mb-4">
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="booking-time">
            <Form.Label>Thời gian muốn đến chơi</Form.Label>
            <Form.Control
              type="datetime-local"
              onChange={(e) => setForm({ ...form, booking_time: e.target.value })}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="booking-duration">
            <Form.Label>Thời lượng (phút)</Form.Label>
            <Form.Control
              type="number" min={30} step={30} value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="booking-zone">
            <Form.Label>Khu vực mong muốn</Form.Label>
            <Form.Select
              value={form.zone_preference}
              onChange={(e) => setForm({ ...form, zone_preference: e.target.value })}
            >
              <option>Thường</option>
              <option>VIP</option>
            </Form.Select>
          </Form.Group>
          <Button type="submit" className="btn-brand">Đặt chỗ ngay</Button>
        </Form>
      </Card>

      <h5>Lịch sử đặt chỗ của bạn</h5>
      <Table striped bordered hover responsive className="bg-white">
        <thead>
          <tr><th>Thời gian</th><th>Thời lượng</th><th>Khu vực</th><th>Trạng thái</th></tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>{new Date(b.booking_time).toLocaleString('vi-VN')}</td>
              <td>{b.duration_minutes} phút</td>
              <td>{b.zone_preference}</td>
              <td><Badge bg="info">{b.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  )
}
