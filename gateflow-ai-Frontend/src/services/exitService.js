/**
 * exitService.js — Exit scanning microservice client.
 *
 * Maps to backend routes/exit_routes.py:
 *   POST /exit/scan                  → ExitScanResponse
 *   GET  /exit/occupancy?space_id=   → OccupancyResponse
 *
 * Roles: GUARD | ADMIN (scan), GUARD | ORGANIZER | RESIDENT | ADMIN (occupancy)
 */

import api from './http/axiosInstance'

const exitService = {
  /**
   * Scan a QR code for exit.
   * Backend marks EntrySession as EXITED and records exit_time.
   * @param {{ qr_token: string, gate_id?: string }} data
   * @returns {Promise<ExitScanResponse>}
   */
  scan: (data) => api.post('/exit/scan', data).then((r) => r.data),

  /**
   * Get current occupancy counts for a space.
   * @param {string} spaceId
   * @returns {Promise<OccupancyResponse>}
   */
  getOccupancy: (spaceId) =>
    api.get('/exit/occupancy', { params: { space_id: spaceId } }).then((r) => r.data),
}

export default exitService
