import React from 'react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ComputerBoard from './pages/ComputerBoard.jsx'
import POS from './pages/POS.jsx'
import BillingPlans from './pages/BillingPlans.jsx'
import ProductsManage from './pages/ProductsManage.jsx'
import Accounts from './pages/Accounts.jsx'
import Bookings from './pages/Bookings.jsx'
import MyBookings from './pages/MyBookings.jsx'
import MyHistory from './pages/MyHistory.jsx'
import MyAccount from './pages/MyAccount.jsx'
import Reports from './pages/Reports.jsx'

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}><Dashboard /></ProtectedRoute>
        } />
        <Route path="/computers" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}><ComputerBoard /></ProtectedRoute>
        } />
        <Route path="/pos" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}><POS /></ProtectedRoute>
        } />
        <Route path="/billing-plans" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}><BillingPlans /></ProtectedRoute>
        } />
        <Route path="/products" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}><ProductsManage /></ProtectedRoute>
        } />
        <Route path="/accounts" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}><Accounts /></ProtectedRoute>
        } />
        <Route path="/bookings" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}><Bookings /></ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}><Reports /></ProtectedRoute>
        } />

        <Route path="/my-bookings" element={
          <ProtectedRoute allowedRoles={['customer']}><MyBookings /></ProtectedRoute>
        } />
        <Route path="/my-history" element={
          <ProtectedRoute allowedRoles={['customer']}><MyHistory /></ProtectedRoute>
        } />
        <Route path="/my-account" element={
          <ProtectedRoute allowedRoles={['customer']}><MyAccount /></ProtectedRoute>
        } />
      </Routes>
    </>
  )
}
