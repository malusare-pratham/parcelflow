import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import api, { setAccessToken } from '../utils/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const authVersion = useRef(0)

  useEffect(() => {
    let alive = true
    const version = authVersion.current
    api.post('/auth/refresh')
      .then(({ data }) => {
        if (!alive || version !== authVersion.current) return
        setAccessToken(data.accessToken)
        setUser(data.user)
      })
      .catch(() => {
        if (!alive || version !== authVersion.current) return
        setAccessToken(null)
        setUser(null)
      })
      .finally(() => {
        if (alive && version === authVersion.current) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const login = useCallback(async (phone, password) => {
    authVersion.current += 1
    const { data } = await api.post('/auth/login', { phone, password })
    setAccessToken(data.accessToken)
    setUser(data.user)
    setLoading(false)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    authVersion.current += 1
    const { data } = await api.post('/auth/register', payload)
    setAccessToken(data.accessToken)
    setUser(data.user)
    setLoading(false)
    return data.user
  }, [])

  const logout = useCallback(() => {
    authVersion.current += 1
    api.post('/auth/logout').catch(() => {})
    setAccessToken(null)
    setUser(null)
    setLoading(false)
  }, [])

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me')
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
