import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Button, Modal, Form, Badge, Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import api from '../services/api'

const STATUS_LABEL = {
  available: 'Trống',
  in_use: 'Đang dùng',
  maintenance: 'Bảo trì',
  reserved: 'Đã đặt',
}

export default function ComputerBoard() {
  const [computers, setComputers] = useState([])
  const [plans, setPlans] = useState([])
  const [selected, setSelected] = useState(null)
  const [activeSessions, setActiveSessions] = useState({})
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newComputer, setNewComputer] = useState({ code: '', zone: 'Thường', billing_plan_id: '' })

  const loadData = async () => {
    try {
      const [computersRes, plansRes, sessionsRes] = await Promise.all([
        api.get('/api/computers/'),
        api.get('/api/billing-plans/'),
        api.get('/api/sessions/?status=active'),
      ])
      setComputers(computersRes.data)
      setPlans(plansRes.data)
      const map = {}
      sessionsRes.data.forEach((s) => { map[s.computer_id] = s })
      setActiveSessions(map)
    } catch (err) {
      setError('Không thể tải dữ liệu máy. Vui lòng kiểm tra kết nối API.')
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000) // tự làm mới mỗi 15s
    return () => clearInterval(interval)
  }, [])

  const handleStart = async (computer) => {
    try {
      await api.post('/api/sessions/start', { computer_id: computer.id })
      loadData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể bắt đầu phiên chơi')
    }
  }

  const handleStop = async (computer) => {
    const session = activeSessions[computer.id]
    if (!session) return
    try {
      const res = await api.post(`/api/sessions/${session.id}/stop`)
      setError('')
      alert(`Đã kết thúc phiên. Thành tiền: ${res.data.total_amount.toLocaleString()}đ`)
      loadData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể kết thúc phiên chơi')
    }
  }

  const handleAddComputer = async () => {
    try {
      await api.post('/api/computers/', newComputer)
      setShowAddModal(false)
      setNewComputer({ code: '', zone: 'Thường', billing_plan_id: '' })
      loadData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể thêm máy')
    }
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>🖥️ Sơ đồ phòng máy (realtime)</h4>
        <Button className="btn-brand" size="sm" onClick={() => setShowAddModal(true)}>+ Thêm máy</Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {plans.length === 0 && (
        <Alert variant="warning">
          Bạn chưa có bảng giá nào. Hãy <Link to="/billing-plans">tạo bảng giá</Link> trước khi thêm máy.
        </Alert>
      )}

      <div className="mb-3">
        <Badge bg="success" className="me-2">Trống</Badge>
        <Badge bg="warning" text="dark" className="me-2">Đang dùng</Badge>
        <Badge bg="secondary" className="me-2">Bảo trì</Badge>
        <Badge bg="primary">Đã đặt</Badge>
      </div>

      <div className="pc-grid">
        {computers.map((c) => (
          <div
            key={c.id}
            className={`pc-box pc-${c.status}`}
            onClick={() => setSelected(c)}
            title={`Khu vực: ${c.zone}`}
          >
            <div>{c.code}</div>
            <small>{STATUS_LABEL[c.status]}</small>
          </div>
        ))}
      </div>

      {computers.length === 0 && (
        <p className="text-muted mt-3">Chưa có máy nào. Hãy bấm "+ Thêm máy" để bắt đầu.</p>
      )}

      {/* Modal chi tiết máy được chọn */}
      <Modal show={!!selected} onHide={() => setSelected(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Máy {selected?.code}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Khu vực: <strong>{selected?.zone}</strong></p>
          <p>Trạng thái: <strong>{STATUS_LABEL[selected?.status]}</strong></p>
          {selected && activeSessions[selected.id] && (
            <p>Bắt đầu lúc: {new Date(activeSessions[selected.id].start_time).toLocaleTimeString('vi-VN')}</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selected?.status === 'available' && (
            <Button className="btn-brand" onClick={() => { handleStart(selected); setSelected(null) }}>
              ▶ Bắt đầu phiên chơi
            </Button>
          )}
          {selected?.status === 'in_use' && (
            <Button variant="danger" onClick={() => { handleStop(selected); setSelected(null) }}>
              ⏹ Kết thúc & tính tiền
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Modal thêm máy mới */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Thêm máy mới</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="computer-code">
            <Form.Label>Mã máy</Form.Label>
            <Form.Control
              placeholder="VD: PC01"
              value={newComputer.code}
              onChange={(e) => setNewComputer({ ...newComputer, code: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="computer-zone">
            <Form.Label>Khu vực</Form.Label>
            <Form.Select
              value={newComputer.zone}
              onChange={(e) => setNewComputer({ ...newComputer, zone: e.target.value })}
            >
              <option>Thường</option>
              <option>VIP</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="computer-billing-plan">
            <Form.Label>Bảng giá áp dụng</Form.Label>
            <Form.Select
              value={newComputer.billing_plan_id}
              onChange={(e) => setNewComputer({ ...newComputer, billing_plan_id: parseInt(e.target.value) })}
            >
              <option value="">-- Chọn bảng giá --</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.price_per_hour.toLocaleString()}đ/giờ)</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-brand" onClick={handleAddComputer}>Lưu</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}
