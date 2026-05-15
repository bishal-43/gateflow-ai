/**
 * Compact notification list for the top bar (dark, mobile-friendly).
 * Mirrors server list into notificationStore like the old full page did.
 */
import { useEffect, useRef, useState } from 'react'
import { Bell, Check, Loader2 } from 'lucide-react'
import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications'
import { useNotificationStore } from '@/store/notificationStore'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const { data: serverData, isLoading, refetch, isFetching } = useNotifications()
  const markRead = useMarkNotificationRead()
  const { notifications, setFromServer, markAsRead, getUnreadCount } = useNotificationStore()

  useEffect(() => {
    if (serverData?.notifications) setFromServer(serverData.notifications)
  }, [serverData, setFromServer])

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    refetch()
  }, [open, refetch])

  const unread = getUnreadCount()

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] max-h-[min(70vh,24rem)] overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
            <span className="text-sm font-semibold text-gray-100">Notifications</span>
            {(isLoading || isFetching) && <Loader2 className="h-4 w-4 animate-spin text-gray-500" aria-hidden />}
          </div>
          <ul className="max-h-[min(60vh,20rem)] overflow-y-auto p-1">
            {notifications.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-gray-500">No notifications yet.</li>
            ) : (
              notifications.map((n) => {
                const read = n.is_read ?? n.read ?? false
                return (
                  <li key={n.id} className="rounded-lg">
                    <div
                      className={cn(
                        'flex flex-col gap-1 px-3 py-2 text-left text-sm',
                        read ? 'text-gray-400' : 'bg-gray-800/80 text-gray-100',
                      )}
                    >
                      <span className="font-medium leading-snug">{n.title}</span>
                      <span className="text-xs text-gray-500 line-clamp-2">{n.message}</span>
                      <span className="text-[10px] text-gray-600">{formatDateTime(n.created_at ?? n.timestamp)}</span>
                      {!read && !n._local && (
                        <button
                          type="button"
                          className="mt-1 self-start text-xs font-medium text-blue-400 hover:text-blue-300"
                          onClick={() => {
                            markAsRead(n.id)
                            markRead.mutate(n.id)
                          }}
                        >
                          <Check className="mr-1 inline h-3 w-3" aria-hidden />
                          Mark read
                        </button>
                      )}
                    </div>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
