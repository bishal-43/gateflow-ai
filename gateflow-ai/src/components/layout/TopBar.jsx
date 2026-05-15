import { useAuthStore } from '@/store/authStore'
import { formatDateTime } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'

export function TopBar({ title, subtitle }) {
  const { user } = useAuthStore()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm px-4 sm:px-6">
      <div className="min-w-0 flex-1 pr-2">
        <h1 className="truncate text-lg font-bold text-white sm:text-xl">{title}</h1>
        {subtitle && (
          <p className="truncate text-xs text-gray-400">
            {typeof subtitle === 'string' ? subtitle : subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden text-xs text-gray-500 md:block">{formatDateTime(currentTime)}</span>

        <NotificationDropdown />

        <div className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-2 py-1.5 sm:px-3">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name} className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
          )}
          <span className="hidden max-w-[10rem] truncate text-sm font-medium text-gray-200 md:block">
            {user?.full_name}
          </span>
        </div>
      </div>
    </header>
  )
}
