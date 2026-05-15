import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import {
  LayoutDashboard, Building2, Ticket, FileText,
  BarChart3, Settings, LogOut, Shield,
  UserPlus, ChevronLeft, ChevronRight, Zap, DoorOpen,
  DoorClosed, Activity
} from 'lucide-react'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

// Organizer / Resident share the same nav structure
const orgNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/spaces', icon: Building2, label: 'Spaces' },
  { to: '/invites', icon: Ticket, label: 'Invites' },
  { to: '/occupancy', icon: Activity, label: 'Occupancy' },
  { to: '/walkins', icon: UserPlus, label: 'Walk-ins', badge: true },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const guardNav = [
  { to: '/guard/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/guard/entry', icon: DoorOpen, label: 'Entry Scan' },
  { to: '/guard/exit', icon: DoorClosed, label: 'Exit Scan' },
  { to: '/guard/walkin', icon: UserPlus, label: 'Walk-In', badge: true },
]

const adminNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/spaces', icon: Building2, label: 'All Spaces' },
  { to: '/invites', icon: Ticket, label: 'Invites' },
  { to: '/occupancy', icon: Activity, label: 'Occupancy' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const navMap = {
  // Backend sends uppercase roles
  ORGANIZER: orgNav,
  RESIDENT: orgNav,
  GUARD: guardNav,
  RESIDENTIAL_GUARD: guardNav,
  ADMIN: adminNav,
  // Lowercase fallbacks for legacy store values
  organizer: orgNav,
  resident: orgNav,
  guard: guardNav,
  residential_guard: guardNav,
  admin: adminNav,
}

const roleLabels = {
  ORGANIZER: 'Event Organizer',
  RESIDENT: 'Resident / Owner',
  GUARD: 'Event security',
  RESIDENTIAL_GUARD: 'Apartment security',
  ADMIN: 'Platform Admin',
  organizer: 'Event Organizer',
  resident: 'Resident / Owner',
  guard: 'Event security',
  residential_guard: 'Apartment security',
  admin: 'Platform Admin',
}

const roleColors = {
  ORGANIZER: 'text-blue-300 bg-blue-950/50',
  RESIDENT: 'text-green-300 bg-green-950/50',
  GUARD: 'text-orange-300 bg-orange-950/50',
  RESIDENTIAL_GUARD: 'text-amber-300 bg-amber-950/50',
  ADMIN: 'text-purple-300 bg-purple-950/50',
  organizer: 'text-blue-300 bg-blue-950/50',
  resident: 'text-green-300 bg-green-950/50',
  guard: 'text-orange-300 bg-orange-950/50',
  residential_guard: 'text-amber-300 bg-amber-950/50',
  admin: 'text-purple-300 bg-purple-950/50',
}

export function Sidebar() {
  const { user, role, logout } = useAuthStore()
  const { notifications } = useNotificationStore()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const navItems = navMap[role] || []

  const confirmLogout = () => {
    setLogoutOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-gray-950 border-r border-gray-800 transition-all duration-300 sticky top-0 z-20',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-gray-800', collapsed && 'justify-center px-2')}>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600">
          <Zap className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-lg font-bold text-white">GateFlow</span>
            <span className="text-lg font-bold text-blue-400"> AI</span>
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && role && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', roleColors[role])}>
            <Shield className="h-3 w-3" aria-hidden="true" />
            {roleLabels[role]}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="Main navigation">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3.5 text-base font-medium transition-colors',
                    'hover:bg-gray-800 hover:text-white',
                    isActive ? 'bg-blue-900/40 text-blue-300 hover:bg-blue-900/40' : 'text-gray-400',
                    collapsed && 'justify-center px-2'
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {!collapsed && item.badge && unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User + Logout */}
      <div className="border-t border-gray-800 p-3">
        {!collapsed && user && (
          <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2 dark:text-gray-200">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {(user.full_name ?? user.name)?.charAt(0).toUpperCase() ?? 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user.full_name ?? user.name}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400',
            'hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          {!collapsed && 'Logout'}
        </button>
      </div>

      <Modal isOpen={logoutOpen} onClose={() => setLogoutOpen(false)} title="Log out">
        <div className="space-y-6 px-6 py-6">
          <p className="text-sm text-gray-300" id="logout-desc">
            Are you sure you want to logout?
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="w-full border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700 sm:w-auto" onClick={() => setLogoutOpen(false)}>
              Go Back
            </Button>
            <Button type="button" variant="destructive" className="w-full sm:w-auto" onClick={confirmLogout}>
              Logout
            </Button>
          </div>
        </div>
      </Modal>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700 bg-gray-900 shadow-sm hover:bg-gray-800 transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight className="h-3 w-3 text-gray-400" />
          : <ChevronLeft className="h-3 w-3 text-gray-400" />}
      </button>
    </aside>
  )
}
