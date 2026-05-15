/**
 * walkinService.js — Walk-in request microservice client.
 *
 * Maps to backend routes/walkin_routes.py:
 *   POST /walkins/request              → WalkInResponse        (GUARD)
 *   POST /walkins/approve/:walkin_id   → WalkInApprovedResponse (ORGANIZER)
 *   POST /walkins/reject/:walkin_id    → WalkInResponse        (ORGANIZER)
 *   GET  /walkins/pending?space_id=    → WalkInListResponse    (ORGANIZER)
 *
 * Walk-in request uses multipart/form-data because proof_image is an UploadFile.
 */

import api from './http/axiosInstance'

const walkinService = {
  /**
   * Guard submits a walk-in request.
   * Uses FormData because proof_image is an optional file upload.
   * @param {{ space_id, visitor_name, visitor_phone?, reason?, proof_image?: File }} data
   * @returns {Promise<WalkInResponse>}
   */
  createRequest: ({ space_id, visitor_name, visitor_phone, reason, proof_image }) => {
    const form = new FormData()
    form.append('space_id', space_id)
    form.append('visitor_name', visitor_name)
    if (visitor_phone) form.append('visitor_phone', visitor_phone)
    if (reason) form.append('reason', reason)
    if (proof_image) form.append('proof_image', proof_image)

    return api
      .post('/walkins/request', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  /**
   * Organizer approves a walk-in — backend auto-creates an Invite + QR.
   * @param {{ walkinId: string, validFrom?: string, validUntil?: string }} params
   * @returns {Promise<WalkInApprovedResponse>}
   */
  approve: ({ walkinId, validFrom, validUntil }) => {
    const body = {}
    if (validFrom)  body.valid_from  = validFrom
    if (validUntil) body.valid_until = validUntil
    return api.post(`/walkins/approve/${walkinId}`, body).then((r) => r.data)
  },

  /**
   * Organizer rejects a walk-in with an optional note.
   * @param {string} walkinId
   * @param {string} [note]
   * @returns {Promise<WalkInResponse>}
   */
  reject: (walkinId, note) =>
    api.post(`/walkins/reject/${walkinId}`, { note: note ?? null }).then((r) => r.data),

  /**
   * List pending walk-in requests, optionally filtered by space.
   * @param {string} [spaceId]
   * @returns {Promise<WalkInListResponse>}
   */
  listPending: (spaceId) => {
    const params = spaceId ? { space_id: spaceId } : {}
    return api.get('/walkins/pending', { params }).then((r) => r.data)
  },
}

export default walkinService
