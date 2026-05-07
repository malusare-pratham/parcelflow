import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
})

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pf_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // Let the browser/axios set multipart boundaries for FormData uploads.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type']
    delete config.headers['content-type']
  } else if (!config.headers['Content-Type'] && !config.headers['content-type']) {
    config.headers['Content-Type'] = 'application/json'
  }

  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pf_token')
      localStorage.removeItem('pf_user')
      const next = `${window.location.pathname || '/'}${window.location.search || ''}`
      window.location.href = `/login?next=${encodeURIComponent(next)}`
    }
    return Promise.reject(err)
  }
)

export default api
