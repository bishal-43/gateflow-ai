/**
 * axiosInstance.js — Axios instance for the backend microservice.
 *
 * Responsibilities:
 *  - Attaches Authorization: Bearer <token> to every request
 *  - Intercepts 401 → attempts silent token refresh → retries original request
 *  - On refresh failure → clears auth state and redirects to /login
 *  - Normalises error shape so callers always get { message, status, data }
 *  - In MOCK_MODE: intercepts requests and returns mock data (no network calls)
 *
 * CI/CD: set VITE_MOCK_MODE=false — mock interceptor is never registered.
 */

import axios from 'axios'
import { env } from '@/config/env'

let _getAuthStore = null
export const setAuthStoreGetter = (fn) => { _getAuthStore = fn }

const api = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Mock interceptor (only active when VITE_MOCK_MODE=true) ───────────────────
if (env.MOCK_MODE) {
  api.interceptors.request.use(async (config) => {
    const { handleMockRequest } = await import('@/mock/mockHandlers')
    const mockResponse = await handleMockRequest(config)
    if (mockResponse !== null) {
      // Abort the real request and return mock data
      config.adapter = () => Promise.resolve(mockResponse)
    }
    return config
  })
}

// ── Request interceptor — attach token ────────────────────────────────────────
api.interceptors.request.use((config) => {
  const store = _getAuthStore?.()
  const token = store?.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — handle 401 / normalise errors ─────────────────────
let _isRefreshing = false
let _refreshQueue = []

const processQueue = (error, token = null) => {
  _refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  _refreshQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject })
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`
            return api(original)
          })
          .catch((e) => Promise.reject(e))
      }

      original._retry = true
      _isRefreshing = true

      try {
        const store = _getAuthStore?.()
        const refreshToken = store?.refreshToken
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(
          `${env.API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken },
        )

        store?.setTokens(data.access_token, data.refresh_token)
        processQueue(null, data.access_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        _getAuthStore?.()?.logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        _isRefreshing = false
      }
    }

    const isNetwork =
      !error.response &&
      (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.message?.includes('Network'))

    const message = isNetwork
      ? `Cannot reach API at ${env.API_BASE_URL}. Start the backend, check VITE_API_BASE_URL, and ensure CORS allows this app's origin (same host/port as this page, e.g. http://localhost:5173).`
      : error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred'

    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
      originalError: error,
    })
  },
)

export default api
