import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('senai_hub_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname
      const isAuthPage = ['/login', '/recuperar-senha', '/redefinir-senha'].some((p) => path.startsWith(p))

      localStorage.removeItem('senai_hub_token')
      localStorage.removeItem('senai_hub_user')

      if (!isAuthPage) {
        const expired = path !== '/login' ? '?expired=1' : ''
        window.location.href = `/login${expired}`
      }
    }

    return Promise.reject(error)
  },
)

export default api
