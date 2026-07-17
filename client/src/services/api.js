/*
  SERVICES/API.JS — Axios API calls to backend
  ──────────────────────────────────────────────
  This file handles ALL communication between
  React frontend and your Express backend.

  Think of it like rag.py in your Python projects —
  one place where all the "talk to external service"
  code lives. Components never call the backend
  directly — they always go through this file.

  axios is like Python's requests library:
  requests.get(url) = axios.get(url)
  requests.post(url, json=data) = axios.post(url, data)
*/

import axios from 'axios'

// Base URL of your Express backend
// In development: http://localhost:5000
// In production: your deployed backend URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create an axios instance with default config
// This way we don't repeat the base URL everywhere
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

/*
  REQUEST INTERCEPTOR
  ───────────────────
  Runs before EVERY request automatically.
  Reads the JWT token from localStorage and
  adds it to the Authorization header.

  This means protected routes work automatically —
  you don't have to manually add the token
  every time you make a request.

  Without this:
  axios.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })

  With this:
  axios.get('/auth/me')  ← token added automatically
*/
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/*
  RESPONSE INTERCEPTOR
  ─────────────────────
  Runs after EVERY response automatically.
  If the server returns 401 (Unauthorized) —
  meaning the token expired or is invalid —
  we automatically log the user out and
  redirect to the login page.
*/
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── AUTH ENDPOINTS ─────────────────────────────

/*
  register(name, email, password)
  ────────────────────────────────
  Sends POST /api/auth/register
  Returns: { token, user: { id, name, email, credits } }
*/
export const register = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password })
  return response.data
}

/*
  login(email, password)
  ────────────────────────
  Sends POST /api/auth/login
  Returns: { token, user: { id, name, email, credits } }
*/
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  return response.data
}

/*
  getMe()
  ────────
  Sends GET /api/auth/me (protected)
  Returns: { user: { id, name, email, credits } }
  Token added automatically by interceptor
*/
export const getMe = async () => {
  const response = await api.get('/auth/me')
  return response.data
}
export const sendMessage = async (message) => {
  const response = await api.post('/chat', { message })
  return response.data
}
export default api
