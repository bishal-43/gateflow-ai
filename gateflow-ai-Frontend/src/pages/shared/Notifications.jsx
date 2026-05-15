/**
 * Notifications.jsx — Notification center.
 *
 * Data sources:
 *  - GET    /notifications        → useNotifications
 *  - POST   /notifications/read-all → useMarkAllNotificationsRead
 *  - PATCH  /notifications/:id/read → useMarkNotificationRead
 *
 * Also shows local WebSocket notifications from notificationStore.
 */

import { useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { ErrorState, EmptyState } from '@/components/ui/ErrorState'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications'
import { useNotificationStore } from '@/store/notificationStore'
import { cn, formatDateTime } from '@/lib/utils'
import {
  Bell, CheckCheck, UserPlus, Shield, Calendar,
  DoorOpen, DoorClosed, AlertTriangle
} from 'lucide-react'

const TYPE_CONFIG = {
  WALKIN_REQUEST: { icon: UserPlus, color: 'text-orange-500', bg: 'bg-orange-50' },
  OVERSTAY_ALERT: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  QR_REJECTED: { icon: Shield, color: 'text-red-500', bg: 'bg-red-50' },
  EVENT_REMINDER: { icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
  // Local WS types
  walkin: { icon: UserPlus, color: 'text-orange-500', bg: 'bg-orange-50' },
  entry: { icon: DoorOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
  exit: { icon: DoorClosed, color: 'text-gray-500', bg: 'bg-gray-50' },
  overstay: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  security: { icon: Shield, color: 'text-red-500', bg: 'bg-red-50' },
  default: { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-50' },
}

const PRIORITY_VARIANT = { urgent: 'destructive', important: 'warning', normal: 'secondary' }

export default function Notifications() {
  const { data: serverData, isLoading, error, refetch } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const { notifications, setFromServer, markAsRead, removeNotification, getUnreadCount } = useNotificationStore()

  // Sync server notifications into store
  useEffect(() => {
    if (serverData?.notifications) {
      setFromServer(serverData.notifications)
    }
  }, [serverData, setFromServer])

  const unreadCount = getUnreadCount()

  const handleMarkRead = (notif) => {
    markAsRead(notif.id)
    // Only call API for server notifications (not local WS ones)
    if (!notif._local) {
      markRead.mutate(notif.id)
    }
  }

  return (
    <DashboardLayout title="Notifications" subtitle={`${unreadCount} unread`}>
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{notifications.length} total</span>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              Mark all read
            </Button>
          )}
        </div>

        {isLoading && notifications.length === 0 ? (
          <SkeletonTable rows={4} />
        ) : error && notifications.length === 0 ? (
          <ErrorState error={error} onRetry={refetch} title="Failed to load notifications" />
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
        ) : (
          <div className="space-y-2" role="list" aria-label="Notifications">
            {notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.default
              const Icon = cfg.icon
              const isRead = n.is_read ?? n.read ?? false
              const priority = n.priority ?? (n.type === 'OVERSTAY_ALERT' || n.type === 'overstay' ? 'urgent' : 'normal')

              return (
                <div
                  key={n.id}
                  role="listitem"
                  className={cn(
                    'flex items-start gap-4 rounded-xl border p-4 transition-colors',
                    isRead ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50/50',
                  )}
                >
                  <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', cfg.bg)}>
                    <Icon className={cn('h-5 w-5', cfg.color)} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn('text-sm font-medium', isRead ? 'text-gray-700' : 'text-gray-900')}>
                          {n.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDateTime(n.created_at ?? n.timestamp)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={PRIORITY_VARIANT[priority] ?? 'secondary'}>{priority}</Badge>
                        {!isRead && <span className="h-2 w-2 rounded-full bg-blue-500" aria-label="Unread" />}
                      </div>
                    </div>
                    <div className="mt-2 flex gap-3">
                      {!isRead && (
                        <button
                          onClick={() => handleMarkRead(n)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => removeNotification(n.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        aria-label={`Remove: ${n.title}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
