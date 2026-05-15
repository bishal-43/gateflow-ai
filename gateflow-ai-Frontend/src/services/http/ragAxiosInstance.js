/**
 * ragAxiosInstance.js — Axios instance for the RAG / AI microservice.
 *
 * Kept completely separate from the backend instance so:
 *  - RAG service can be deployed/scaled independently
 *  - Auth strategy can differ (this repo’s RAG app has no JWT; only network access control)
 *  - Timeouts are longer (LLM calls can take 10-30 s)
 *  - Failures here never affect backend API calls
 *
 * In MOCK_MODE: returns mock RAG responses — no network calls.
 * CI/CD: set VITE_MOCK_MODE=false — mock interceptor is never registered.
 */

import axios from 'axios'
import { env } from '@/config/env'

const ragApi = axios.create({
  baseURL: env.RAG_BASE_URL,
  timeout: 45_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Mock interceptor (only active when VITE_MOCK_MODE=true) ───────────────────
if (env.MOCK_MODE) {
  ragApi.interceptors.request.use(async (config) => {
    const { handleMockRAGRequest } = await import('@/mock/mockHandlers')
    const mockResponse = await handleMockRAGRequest(config)
    if (mockResponse !== null) {
      config.adapter = () => Promise.resolve(mockResponse)
    }
    return config
  })
}

// ── Normalise RAG errors ──────────────────────────────────────────────────────
ragApi.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'AI service unavailable'

    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
      isRagError: true,
      originalError: error,
    })
  },
)

export default ragApi
