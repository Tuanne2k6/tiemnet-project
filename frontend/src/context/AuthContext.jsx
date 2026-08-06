import React, { createContext, useContext, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('current_user')
    return stored ? JSON.parse(stored) : null
  })

  const login = async (username, password) => {
    // API dùng chuẩn OAuth2PasswordRequestForm -> gửi form-urlencoded
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const res = await api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    localStorage.setItem('access_token', res.data.access_token)
    localStorage.setItem('current_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  const register = async (payload) => {
    await api.post('/api/auth/register', payload)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('current_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
