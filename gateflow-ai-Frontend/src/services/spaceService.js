/**
 * spaceService.js — Space microservice client.
 *
 * Maps to backend routes/space_routes.py:
 *   POST   /spaces
 *   GET    /spaces
 *   GET    /spaces/:id
 *   PUT    /spaces/:id
 *   DELETE /spaces/:id
 *   POST   /spaces/:id/guards/invite
 *   POST   /spaces/:id/guards
 *   GET    /spaces/:id/guards
 *   DELETE /spaces/:id/guards/:guard_user_id
 *
 * Roles: ORGANIZER | RESIDENT | ADMIN
 */

import api from './http/axiosInstance'

const spaceService = {
  /**
   * Create a new space.
   * @param {{ type, name, venue?, start_time?, end_time?, address?, walkin_enabled, max_guests? }} data
   * @returns {Promise<SpaceResponse>}
   */
  create: (data) => api.post('/spaces', data).then((r) => r.data),

  /**
   * List all spaces owned by the current user.
   * @returns {Promise<SpaceListResponse>}
   */
  list: () => api.get('/spaces').then((r) => r.data),

  /**
   * Get a single space by ID.
   * @param {string} spaceId
   * @returns {Promise<SpaceResponse>}
   */
  getOne: (spaceId) => api.get(`/spaces/${spaceId}`).then((r) => r.data),

  /**
   * Update a space.
   * @param {string} spaceId
   * @param {Partial<CreateSpaceRequest>} data
   * @returns {Promise<SpaceResponse>}
   */
  update: (spaceId, data) => api.put(`/spaces/${spaceId}`, data).then((r) => r.data),

  /**
   * Delete a space.
   * @param {string} spaceId
   * @returns {Promise<void>}
   */
  delete: (spaceId) => api.delete(`/spaces/${spaceId}`).then((r) => r.data),

  inviteGuard: (spaceId, email) =>
    api.post(`/spaces/${spaceId}/guards/invite`, { email }).then((r) => r.data),

  addGuard: (spaceId, email) =>
    api.post(`/spaces/${spaceId}/guards`, { email }).then((r) => r.data),

  listGuards: (spaceId) => api.get(`/spaces/${spaceId}/guards`).then((r) => r.data),

  removeGuard: (spaceId, guardUserId) =>
    api.delete(`/spaces/${spaceId}/guards/${guardUserId}`).then(() => undefined),
}

export default spaceService
