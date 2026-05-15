import { NavLink, useNavigate } from 'react-router-dom'
import { useVisitorSessionStore } from '@/store/visitorSessionStore'
import { ToastContainer } from '@/components/ui/Toast'
import { MockBanner } from '@/components/ui/MockBanner'
import { Ticket, Info, MessageSquare, Zap, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const visitorNav = [
  { to: '/visitor/pass', icon: Ticket, label: 'My pass' },
  { to: '/visitor/details', icon: Info, label: 'Details' },
  { to: '/visitor/chat', icon: MessageSquare, label: 'Ask' },
]

export function VisitorLayout({ children, title }) {
  const { visitorName, space, clearSession } = useVisitorSessionStore()
  const spaceTitle = space?.name ?? null
  const navigate = useNavigate()

  const handleLeave = () => {
    clearSession()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MockBanner />
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <Zap className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">GateFlow AI</p>
              {spaceTitle && <p className="text-xs text-gray-500 leading-none">{spaceTitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {visitorName && (
              <span className="hidden text-xs text-gray-500 sm:block">{visitorName}</span>
            )}
            <button
              onClick={handleLeave}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              aria-label="Leave visitor session"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main
        className="flex flex-1 flex-col min-h-0 mx-auto w-full max-w-lg px-4 py-6"
        id="main-content"
      >
        {children}
      </main>

      {/* Bottom nav — mobile-first */}
      <nav
        className="sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm"
        aria-label="Visitor navigation"
      >
        <div className="mx-auto max-w-lg flex">
          {visitorNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 py-4 text-sm font-semibold transition-colors',
                  isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                )
              }
            >
              <item.icon className="h-6 w-6" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <ToastContainer />
    </div>
  )
}
