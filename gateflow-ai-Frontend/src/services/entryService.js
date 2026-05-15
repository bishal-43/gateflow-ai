/**
 * entryService.js — Entry scanning microservice client.
 *
 * Maps to backend routes/entry_routes.py:
 *   POST /entry/scan              → EntryScanResponse
 *   GET  /entry/active?space_id=  → ActiveVisitorsResponse
 *
 * Roles: GUARD | ADMIN (scan), GUARD | ORGANIZER | RESIDENT | ADMIN (active)
 */

import api from './http/axiosInstance'

const entryService = {
  /**
   * Scan a QR code for entry.
   * Backend validates token, checks expiry/revocation, records EntrySession.
   * @param {{ qr_token: string, gate_id?: string }} data
   * @returns {Promise<EntryScanResponse>}
   */
  scan: (data) => api.post('/entry/scan', data).then((r) => r.data),

  /**
   * Get all currently active (INSIDE) visitors for a space.
   * @param {string} spaceId
   * @returns {Promise<ActiveVisitorsResponse>}
   */
  getActive: (spaceId) =>
    api.get('/entry/active', { params: { space_id: spaceId } }).then((r) => r.data),
}

export default entryService
