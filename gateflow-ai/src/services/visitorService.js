/**
 * visitorService.js — Public visitor endpoints (no auth required).
 *
 * Maps to backend routes/visitor_routes.py:
 *   GET /visitor/invite/:token   → InviteOpenResponse (full pass data + QR b64)
 *   GET /visitor/qr/:token       → QRTokenResponse
 *   GET /visitor/details/:token  → VisitorDetailsResponse
 */

import api from './http/axiosInstance'

const visitorService = {
  /**
   * Open an invite by token — returns full pass data including base64 QR image.
   * Called when visitor opens /invite/:token link.
   * @param {string} token
   * @returns {Promise<InviteOpenResponse>}
   */
  openInvite: (token) =>
    api.get(`/visitor/invite/${encodeURIComponent(token)}`).then((r) => r.data),

  /**
   * Get QR token data for a visitor.
   * @param {string} token
   * @returns {Promise<QRTokenResponse>}
   */
  getQR: (token) =>
    api.get(`/visitor/qr/${encodeURIComponent(token)}`).then((r) => r.data),

  /**
   * Get visitor details (space info, invite info) without internal fields.
   * @param {string} token
   * @returns {Promise<VisitorDetailsResponse>}
   */
  getDetails: (token) =>
    api.get(`/visitor/details/${encodeURIComponent(token)}`).then((r) => r.data),
}

export default visitorService
