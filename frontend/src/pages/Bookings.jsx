import React, { useEffect, useState } from 'react'
import { Container, Table, Badge, Button, Alert } from 'react-bootstrap'
import api from '../services/api'

const STATUS_VARIANT = {
  pending: 'warning',
  confirmed: 'primary',
  completed: 'success',
  cancelled: 'secondary',
}

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const res = await api.get('/api/bookings/')
      setBookings(res.data)
    } catch (err) {
      setError('Không thể tải danh sách đặt chỗ')
    }
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/bookings/${id}`, { status })
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể cập nhật')
    }
  }

  return (
    <Container className="py-4">
      <h4 className="mb-3">📅 Quản lý đặt chỗ trước</h4>
      {error && <Alert variant="danger">{error}</Alert>}
      <Table striped bordered hover responsive className="bg-white">
        <thead>
          <tr>
            <th>#</th><th>Khách hàng (ID)</th><th>Thời gian đặt</th><th>Thời lượng</th><th>Khu vực</th><th>Trạng thái</th><th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>{b.id}</td>
              <td>{b.customer_id}</td>
              <td>{new Date(b.booking_time).toLocaleString('vi-VN')}</td>
              <td>{b.duration_minutes} phút</td>
              <td>{b.zone_preference || '-'}</td>
              <td><Badge bg={STATUS_VARIANT[b.status]}>{b.status}</Badge></td>
              <td>
                {b.status === 'pending' && (
                  <>
                    <Button size="sm" className="btn-brand me-2" onClick={() => updateStatus(b.id, 'confirmed')}>Xác nhận</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => updateStatus(b.id, 'cancelled')}>Hủy</Button>
                  </>
                )}
                {b.status === 'confirmed' && (
                  <Button size="sm" variant="success" onClick={() => updateStatus(b.id, 'completed')}>Hoàn tất</Button>
                )}
              </td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr><td colSpan={7} className="text-center text-muted">Chưa có lượt đặt chỗ nào</td></tr>
          )}
        </tbody>
      </Table>
    </Container>
  )
}
