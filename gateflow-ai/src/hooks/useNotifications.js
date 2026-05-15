/**
 * useNotifications.js — Notification hooks.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import notificationService from '@/services/notificationService'
import { toast } from '@/components/ui/Toast'

export const NOTIFS_KEY = ['notifications']

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFS_KEY,
    queryFn: notificationService.list,
    refetchInterval: 30_000,
    staleTime: 15_000,
    select: (data) => data,
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFS_KEY }),
    onError: (err) => toast(err.message, 'error'),
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFS_KEY }),
    onError: (err) => toast(err.message, 'error'),
  })
}
