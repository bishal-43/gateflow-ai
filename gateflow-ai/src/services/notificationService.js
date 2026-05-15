/**
 * notificationService.js — Notification microservice client.
 *
 * Maps to backend routes/notification_routes.py:
 *   POST  /notifications/send          → NotificationResponse  (ADMIN only)
 *   GET   /notifications               → NotificationListResponse (also /notifications/)
 *   POST  /notifications/read-all      → NotificationListResponse
 *   PATCH /notifications/:id/read      → NotificationResponse
 */

import api from './http/axiosInstance'

const notificationService = {
  /**
   * List all notifications for the current user (includes unread count).
   * @returns {Promise<NotificationListResponse>}
   */
  list: () => api.get('/notifications').then((r) => r.data),

  /**
   * Mark every notification as read for the current user.
   * @returns {Promise<NotificationListResponse>}
   */
  markAllRead: () => api.post('/notifications/read-all').then((r) => r.data),

  /**
   * Mark a notification as read.
   * @param {string} notifId
   * @returns {Promise<NotificationResponse>}
   */
  markRead: (notifId) =>
    api.patch(`/notifications/${notifId}/read`).then((r) => r.data),

  /**
   * Send a notification to a specific user (ADMIN only).
   * @param {{ user_id, space_id?, type, title, message }} data
   * @returns {Promise<NotificationResponse>}
   */
  send: (data) => api.post('/notifications/send', data).then((r) => r.data),
}

export default notificationService
