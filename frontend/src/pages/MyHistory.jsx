import React, { useEffect, useState } from 'react'
import { Container, Table, Badge } from 'react-bootstrap'
import api from '../services/api'

export default function MyHistory() {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    api.get('/api/sessions/my-history').then((res) => setSessions(res.data))
  }, [])

  const totalSpent = sessions
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + s.total_amount, 0)

  return (
    <Container className="py-4">
      <h4 className="mb-3">🕹️ Lịch sử giờ chơi của bạn</h4>
      <p>Tổng chi tiêu (giờ chơi): <strong>{totalSpent.toLocaleString()}đ</strong></p>
      <Table striped bordered hover responsive className="bg-white">
        <thead>
          <tr><th>Bắt đầu</th><th>Kết thúc</th><th>Trạng thái</th><th>Thành tiền</th></tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id}>
              <td>{new Date(s.start_time).toLocaleString('vi-VN')}</td>
              <td>{s.end_time ? new Date(s.end_time).toLocaleString('vi-VN') : '-'}</td>
              <td><Badge bg={s.status === 'active' ? 'warning' : 'success'}>{s.status}</Badge></td>
              <td>{s.total_amount.toLocaleString()}đ</td>
            </tr>
          ))}
          {sessions.length === 0 && (
            <tr><td colSpan={4} className="text-center text-muted">Chưa có lịch sử chơi</td></tr>
          )}
        </tbody>
      </Table>
    </Container>
  )
}
