/**
 * notificationStore.js — Client-side notification state.
 *
 * Serves two purposes:
 *  1. Mirrors backend notifications fetched via notificationService
 *  2. Holds local real-time notifications pushed by WebSocket events
 *
 * Backend notification types (from models/notification.py):
 *   WALKIN_REQUEST | OVERSTAY_ALERT | QR_REJECTED | EVENT_REMINDER
 *
 * Local-only types added by WebSocket hook:
 *   entry | exit | walkin | overstay | security
 */

import { create } from 'zustand'

export const useNotificationStore = create((set, get) => ({
  /** @type {Array} Combined backend + local notifications */
  notifications: [],

  /**
   * Replace notifications with fresh data from backend.
   * Called after notificationService.list() resolves.
   * @param {Array} serverNotifications
   */
  setFromServer: (serverNotifications) => {
    set((state) => {
      // Keep local-only notifications (no id from server) and merge
      const localOnly = state.notifications.filter((n) => n._local === true)
      const merged = [...serverNotifications, ...localOnly]
      // Deduplicate by id
      const seen = new Set()
      return {
        notifications: merged.filter((n) => {
          if (seen.has(n.id)) return false
          seen.add(n.id)
          return true
        }),
      }
    })
  },

  /**
   * Add a local notification (from WebSocket or optimistic update).
   * @param {{ type, title, message, priority }} notification
   */
  addNotification: (notification) => {
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: `local-${Date.now()}-${Math.random()}`,
          is_read: false,
          created_at: new Date().toISOString(),
          _local: true,
        },
        ...state.notifications,
      ],
    }))
  },

  /**
   * Mark a notification as read (optimistic — server call handled by hook).
   * @param {string} id
   */
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n,
      ),
    }))
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
    }))
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  },

  getUnreadCount: () => get().notifications.filter((n) => !n.is_read).length,
}))
