import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'
let accessToken = null

export const setAccessToken = (token) => {
  accessToken = token || null
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`

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
  async (err) => {
    const original = err.config || {}
    const url = original.url || ''
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')

    if (err.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true
      try {
        const { data } = await api.post('/auth/refresh')
        setAccessToken(data.accessToken)
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        setAccessToken(null)
      }
    }

    if (err.response?.status === 401 && !isAuthEndpoint) {
      setAccessToken(null)
      const next = `${window.location.pathname || '/'}${window.location.search || ''}`
      window.location.href = `/login?next=${encodeURIComponent(next)}`
    }
    return Promise.reject(err)
  }
)

export default api
