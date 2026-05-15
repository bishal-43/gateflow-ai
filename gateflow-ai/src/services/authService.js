/**
 * authService.js — Auth microservice client.
 *
 * Maps to backend routes/auth_routes.py:
 *   POST /auth/register
 *   POST /auth/login
 *   POST /auth/logout
 *   POST /auth/refresh
 *   GET  /auth/me
 *   GET  /auth/guard-invite/preview  (token query — public)
 *   POST /auth/register-guard
 *   GET  /auth/google          (redirect)
 *   GET  /auth/google/callback (handled by backend)
 */

import api from './http/axiosInstance'
import { env } from '@/config/env'

const authService = {
  /**
   * Register a new user.
   * @param {{ full_name, email, password, role }} data
   * @returns {Promise<TokenResponse>}
   */
  register: (data) => api.post('/auth/register', data).then((r) => r.data),

  /**
   * Login with email + password.
   * @param {{ email, password }} data
   * @returns {Promise<TokenResponse>}
   */
  login: (data) => api.post('/auth/login', data).then((r) => r.data),

  /**
   * Logout — revokes both access and refresh tokens.
   * @param {string} refreshToken
   */
  logout: (refreshToken) =>
    api.post('/auth/logout', { refresh_token: refreshToken }).then((r) => r.data),

  /**
   * Exchange refresh token for new token pair.
   * @param {string} refreshToken
   * @returns {Promise<TokenResponse>}
   */
  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }).then((r) => r.data),

  /**
   * Get current authenticated user profile.
   * @returns {Promise<UserResponse>}
   */
  me: () => api.get('/auth/me').then((r) => r.data),

  /**
   * Public preview for guard invite signup page.
   * @param {string} token JWT from organizer link
   */
  previewGuardInvite: (token) =>
    api.get('/auth/guard-invite/preview', { params: { token } }).then((r) => r.data),

  /**
   * Complete guard registration with invite token.
   * @param {{ token, full_name, email, password }} data
   */
  registerGuard: (data) => api.post('/auth/register-guard', data).then((r) => r.data),

  /**
   * Initiate Google OAuth2 — returns the redirect URL.
   * Frontend should redirect the browser to this URL.
   */
  googleLoginUrl: () => `${env.API_BASE_URL}/auth/google`,
}

export default authService
