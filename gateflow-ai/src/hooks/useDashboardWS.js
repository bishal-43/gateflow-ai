/**
 * useDashboardWS.js — React hook for the live dashboard WebSocket.
 *
 * Connects when a spaceId is provided, disconnects on unmount.
 * Invalidates TanStack Query caches on ENTRY/EXIT/WALKIN events
 * so dashboard data stays fresh without polling.
 */

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { dashboardWS } from '@/services/websocketService'
import { useNotificationStore } from '@/store/notificationStore'
import { useAuthStore } from '@/store/authStore'

/**
 * @param {string | null} spaceId
 * @param {{ onEntry?, onExit?, onWalkin? }} [callbacks]
 */
export function useDashboardWS(spaceId, callbacks = {}) {
  const qc = useQueryClient()
  const { addNotification } = useNotificationStore()
  const token = useAuthStore((s) => s.token)
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    if (!spaceId || !token) return

    dashboardWS.connect(spaceId)

    const unsubEntry = dashboardWS.on('ENTRY', (msg) => {
      qc.invalidateQueries({ queryKey: ['dashboard', spaceId] })
      qc.invalidateQueries({ queryKey: ['entry', 'active', spaceId] })
      addNotification({
        type: 'entry',
        title: 'Visitor Entered',
        message: `${msg.visitor_name} entered at ${msg.gate_id ?? 'gate'}`,
        priority: 'normal',
      })
      callbacksRef.current.onEntry?.(msg)
    })

    const unsubExit = dashboardWS.on('EXIT', (msg) => {
      qc.invalidateQueries({ queryKey: ['dashboard', spaceId] })
      qc.invalidateQueries({ queryKey: ['entry', 'active', spaceId] })
      addNotification({
        type: 'exit',
        title: 'Visitor Exited',
        message: `${msg.visitor_name} exited`,
        priority: 'normal',
      })
      callbacksRef.current.onExit?.(msg)
    })

    const unsubWalkin = dashboardWS.on('WALKIN', (msg) => {
      qc.invalidateQueries({ queryKey: ['walkins'] })
      qc.invalidateQueries({ queryKey: ['dashboard', spaceId] })
      addNotification({
        type: 'walkin',
        title: 'New Walk-in Request',
        message: `${msg.visitor_name} is requesting entry`,
        priority: 'urgent',
      })
      callbacksRef.current.onWalkin?.(msg)
    })

    return () => {
      unsubEntry()
      unsubExit()
      unsubWalkin()
      // Don't disconnect here — other components may still be using it
    }
  }, [spaceId, token, qc, addNotification])

  return {
    isConnected: dashboardWS.isConnected,
    disconnect: () => dashboardWS.disconnect(),
  }
}
