import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// Backend sends uppercase roles: ORGANIZER | RESIDENT | GUARD | RESIDENTIAL_GUARD | ADMIN
const ROLE_HOME = {
  ORGANIZER: '/dashboard',
  RESIDENT: '/dashboard',
  GUARD: '/guard/dashboard',
  RESIDENTIAL_GUARD: '/guard/dashboard',
  ADMIN: '/dashboard',
}

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={ROLE_HOME[role] ?? '/login'} replace />
  }

  return children
}
