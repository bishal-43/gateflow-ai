/**
 * websocketService.js — Live dashboard WebSocket client.
 *
 * Connects to: ws://host/ws/dashboard/{space_id}?token=<access_jwt>
 * (Same contract as gateflow-backend main.py — token required.)
 *
 * Backend broadcasts three event types (from websocket/dashboard_ws.py):
 *   { event: "ENTRY",  space_id, visitor_name, session_id, gate_id }
 *   { event: "EXIT",   space_id, visitor_name, session_id }
 *   { event: "WALKIN", space_id, visitor_name, walkin_id }
 *
 * Design:
 *  - One connection per space_id
 *  - Auto-reconnect with exponential backoff (max 30 s)
 *  - Listener registry — multiple components can subscribe
 *  - Graceful cleanup on disconnect
 */

import { env } from '@/config/env'
import { useAuthStore } from '@/store/authStore'

const MAX_RECONNECT_DELAY_MS = 30_000
const BASE_RECONNECT_DELAY_MS = 1_000

class DashboardWebSocket {
  constructor() {
    /** @type {WebSocket | null} */
    this._ws = null
    /** @type {string | null} */
    this._spaceId = null
    /** @type {Map<string, Set<Function>>} event → listeners */
    this._listeners = new Map()
    this._reconnectDelay = BASE_RECONNECT_DELAY_MS
    this._reconnectTimer = null
    this._intentionalClose = false
  }

  /**
   * Connect to the dashboard WebSocket for a specific space.
   * Disconnects any existing connection first.
   * @param {string} spaceId
   */
  connect(spaceId) {
    if (this._spaceId === spaceId && this._ws?.readyState === WebSocket.OPEN) return

    this.disconnect()
    this._spaceId = spaceId
    this._intentionalClose = false
    this._open()
  }

  _open() {
    const token = useAuthStore.getState().token
    const qs = token ? `?token=${encodeURIComponent(token)}` : ''
    const url = `${env.WS_BASE_URL}/ws/dashboard/${this._spaceId}${qs}`
    this._ws = new WebSocket(url)

    this._ws.onopen = () => {
      this._reconnectDelay = BASE_RECONNECT_DELAY_MS
      this._emit('__connected', { spaceId: this._spaceId })
    }

    this._ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        this._emit(msg.event, msg)
        this._emit('*', msg) // wildcard listeners
      } catch {
        // ignore malformed messages
      }
    }

    this._ws.onerror = () => {
      this._emit('__error', { spaceId: this._spaceId })
    }

    this._ws.onclose = () => {
      this._emit('__disconnected', { spaceId: this._spaceId })
      if (!this._intentionalClose) {
        this._scheduleReconnect()
      }
    }
  }

  _scheduleReconnect() {
    clearTimeout(this._reconnectTimer)
    this._reconnectTimer = setTimeout(() => {
      this._reconnectDelay = Math.min(this._reconnectDelay * 2, MAX_RECONNECT_DELAY_MS)
      this._open()
    }, this._reconnectDelay)
  }

  /**
   * Disconnect and stop reconnecting.
   */
  disconnect() {
    this._intentionalClose = true
    clearTimeout(this._reconnectTimer)
    if (this._ws) {
      this._ws.close()
      this._ws = null
    }
    this._spaceId = null
  }

  /**
   * Subscribe to a WebSocket event.
   * @param {'ENTRY'|'EXIT'|'WALKIN'|'*'|'__connected'|'__disconnected'|'__error'} event
   * @param {Function} listener
   * @returns {() => void} unsubscribe function
   */
  on(event, listener) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set())
    this._listeners.get(event).add(listener)
    return () => this._listeners.get(event)?.delete(listener)
  }

  _emit(event, data) {
    this._listeners.get(event)?.forEach((fn) => fn(data))
  }

  get isConnected() {
    return this._ws?.readyState === WebSocket.OPEN
  }
}

// Singleton — one WS connection shared across the app
export const dashboardWS = new DashboardWebSocket()
