import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pf_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pf_token')
      localStorage.removeItem('pf_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
