/**
 * overstayService.js — Overstay detection microservice client.
 *
 * Maps to backend routes/overstay_routes.py:
 *   GET  /overstay/active?space_id=       → OverstaysResponse
 *   POST /overstay/resolve/:session_id    → OverstayItem
 *
 * Roles: ORGANIZER | ADMIN
 */

import api from './http/axiosInstance'

const overstayService = {
  /**
   * List all OVERSTAYED sessions for a space.
   * @param {string} spaceId
   * @returns {Promise<OverstaysResponse>}
   */
  getActive: (spaceId) =>
    api
      .get('/overstay/active', { params: { space_id: spaceId } })
      .then((r) => r.data),

  /**
   * Manually resolve an overstay — marks session as EXITED.
   * @param {string} sessionId
   * @returns {Promise<OverstayItem>}
   */
  resolve: (sessionId) =>
    api.post(`/overstay/resolve/${sessionId}`).then((r) => r.data),
}

export default overstayService
