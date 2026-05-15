/**
 * dashboardService.js — Dashboard read-only microservice client.
 *
 * Maps to backend routes/dashboard_routes.py:
 *   GET /dashboard/stats?space_id=      → StatsResponse
 *   GET /dashboard/occupancy?space_id=  → OccupancyResponse
 *   GET /dashboard/entries?space_id=    → EntriesResponse
 *   GET /dashboard/walkins?space_id=    → WalkInsResponse
 *   GET /dashboard/overstays?space_id=  → OverstaysResponse
 *   GET /dashboard/analytics?space_id=  → AnalyticsResponse
 *
 * Roles: ORGANIZER | ADMIN (all), GUARD (occupancy only)
 */

import api from './http/axiosInstance'

const dashboardService = {
  /**
   * Overall counts: inside, exited, overstayed, pending walk-ins, total entries.
   * @param {string} spaceId
   * @returns {Promise<StatsResponse>}
   */
  getStats: (spaceId) =>
    api.get('/dashboard/stats', { params: { space_id: spaceId } }).then((r) => r.data),

  /**
   * Current inside vs exited counts.
   * @param {string} spaceId
   * @returns {Promise<OccupancyResponse>}
   */
  getOccupancy: (spaceId) =>
    api.get('/dashboard/occupancy', { params: { space_id: spaceId } }).then((r) => r.data),

  /**
   * Recent entry sessions (newest first).
   * @param {string} spaceId
   * @param {number} [limit=50]
   * @returns {Promise<EntriesResponse>}
   */
  getEntries: (spaceId, limit = 50) =>
    api
      .get('/dashboard/entries', { params: { space_id: spaceId, limit } })
      .then((r) => r.data),

  /**
   * All walk-in requests for a space.
   * @param {string} spaceId
   * @returns {Promise<WalkInsResponse>}
   */
  getWalkins: (spaceId) =>
    api.get('/dashboard/walkins', { params: { space_id: spaceId } }).then((r) => r.data),

  /**
   * Sessions currently marked OVERSTAYED.
   * @param {string} spaceId
   * @returns {Promise<OverstaysResponse>}
   */
  getOverstays: (spaceId) =>
    api
      .get('/dashboard/overstays', { params: { space_id: spaceId } })
      .then((r) => r.data),

  /**
   * Chart aggregates for the Analytics page.
   * @param {string} spaceId
   * @returns {Promise<object>}
   */
  getAnalytics: (spaceId) =>
    api
      .get('/dashboard/analytics', { params: { space_id: spaceId } })
      .then((r) => r.data),
}

export default dashboardService
