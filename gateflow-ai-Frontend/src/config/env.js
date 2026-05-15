/**
 * env.js — Centralised environment configuration.
 *
 * All service URLs and feature flags are read from Vite env vars here.
 * No other file should reference import.meta.env directly.
 *
 * CI/CD usage:
 *   - Set VITE_MOCK_MODE=false in production/staging pipelines
 *   - Set VITE_API_BASE_URL / VITE_RAG_BASE_URL to deployed service URLs
 *   - Frontend, backend, and RAG remain independently deployable
 */

export const env = {
  /** FastAPI backend base URL — no trailing slash */
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',

  /** RAG / AI microservice base URL — no trailing slash */
  RAG_BASE_URL: import.meta.env.VITE_RAG_BASE_URL ?? 'http://localhost:8001',

  /** WebSocket base URL for live dashboard */
  WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000',

  APP_ENV: import.meta.env.VITE_APP_ENV ?? 'development',
  APP_NAME: import.meta.env.VITE_APP_NAME ?? 'GateFlow AI',

  /**
   * Mock mode — intercepts all API calls with realistic mock data.
   * Set VITE_MOCK_MODE=true in .env for local dev without a backend.
   * Set VITE_MOCK_MODE=false (or omit) in CI/CD for real backend calls.
   */
  MOCK_MODE: import.meta.env.VITE_MOCK_MODE === 'true',

  isDev: (import.meta.env.VITE_APP_ENV ?? 'development') === 'development',
  isProd: (import.meta.env.VITE_APP_ENV ?? 'development') === 'production',
}
