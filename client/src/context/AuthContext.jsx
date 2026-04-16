import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('pf_user')
    const token = localStorage.getItem('pf_token')
    if (stored && token) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (phone, password) => {
    const { data } = await api.post('/auth/login', { phone, password })
    localStorage.setItem('pf_token', data.token)
    localStorage.setItem('pf_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    localStorage.setItem('pf_token', data.token)
    localStorage.setItem('pf_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('pf_token')
    localStorage.removeItem('pf_user')
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me')
    localStorage.setItem('pf_user', JSON.stringify(data.user))
    setUser(data.user)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
