/**
 * inviteService.js — Invite microservice client.
 *
 * Maps to backend routes/invite_routes.py:
 *   POST   /invites
 *   GET    /invites?space_id=&status=
 *   GET    /invites/:id
 *   PUT    /invites/:id
 *   DELETE /invites/:id   (revoke)
 *
 * Roles: ORGANIZER | RESIDENT | ADMIN
 */

import api from './http/axiosInstance'

const inviteService = {
  /**
   * Create a new invite.
   * @param {{ space_id, visitor_name, invite_type, valid_from, valid_until, visitor_email?, visitor_phone? }} data
   * @returns {Promise<InviteCreatedResponse>}
   */
  create: (data) => api.post('/invites', data).then((r) => r.data),

  /**
   * List invites, optionally filtered by space and/or status.
   * @param {{ spaceId?: string, status?: string }} params
   * @returns {Promise<InviteListResponse>}
   */
  list: ({ spaceId, status } = {}) => {
    const params = {}
    if (spaceId) params.space_id = spaceId
    if (status) params.status = status
    return api.get('/invites', { params }).then((r) => r.data)
  },

  /**
   * Get a single invite by ID.
   * @param {string} inviteId
   * @returns {Promise<InviteResponse>}
   */
  getOne: (inviteId) => api.get(`/invites/${inviteId}`).then((r) => r.data),

  /**
   * Update an invite.
   * @param {string} inviteId
   * @param {Partial<UpdateInviteRequest>} data
   * @returns {Promise<InviteResponse>}
   */
  update: (inviteId, data) => api.put(`/invites/${inviteId}`, data).then((r) => r.data),

  /**
   * Revoke an invite (DELETE).
   * @param {string} inviteId
   * @returns {Promise<void>}
   */
  revoke: (inviteId) => api.delete(`/invites/${inviteId}`).then((r) => r.data),
}

export default inviteService
