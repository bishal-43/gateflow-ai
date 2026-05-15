/**
 * App.jsx — Root router.
 *
 * Route groups:
 *  - /login                    → public
 *  - /dashboard, /spaces, ...  → ORGANIZER | RESIDENT | ADMIN
 *  - /guard/*                  → GUARD | RESIDENTIAL_GUARD | ADMIN
 *  - /invite/*                 → public (visitor JWT; splat captures full token)
 *  - /visitor/*                → token-based session (VisitorRoute)
 */

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { VisitorRoute } from '@/components/auth/VisitorRoute'
import { ToastContainer } from '@/components/ui/Toast'

// ── Auth ──────────────────────────────────────────────────────────────────────
import Login from '@/pages/auth/Login'
import RegisterGuard from '@/pages/auth/RegisterGuard'

// ── Lazy-loaded pages (code splitting) ───────────────────────────────────────
const MainDashboard = lazy(() => import('@/pages/dashboard/MainDashboard'))
const SpaceList = lazy(() => import('@/pages/spaces/SpaceList'))
const SpaceGuards = lazy(() => import('@/pages/spaces/SpaceGuards'))
const InviteList = lazy(() => import('@/pages/invites/InviteList'))
const OccupancyDashboard = lazy(() => import('@/pages/occupancy/OccupancyDashboard'))
const WalkInApprovals = lazy(() => import('@/pages/walkins/WalkInApprovals'))
const DocumentUpload = lazy(() => import('@/pages/organizer/DocumentUpload'))
const Analytics = lazy(() => import('@/pages/organizer/Analytics'))
const Settings = lazy(() => import('@/pages/organizer/Settings'))

const GuardDashboard = lazy(() => import('@/pages/guard/GuardDashboard'))
const EntryScan = lazy(() => import('@/pages/guard/EntryScan'))
const ExitScan = lazy(() => import('@/pages/guard/ExitScan'))
const WalkInForm = lazy(() => import('@/pages/guard/WalkInForm'))

const InviteLanding = lazy(() => import('@/pages/visitor/InviteLanding'))
const VisitorPass = lazy(() => import('@/pages/visitor/VisitorPass'))
const VisitorDetails = lazy(() => import('@/pages/visitor/VisitorDetails'))
const VisitorChat = lazy(() => import('@/pages/visitor/VisitorChat'))

// ── Role groups ───────────────────────────────────────────────────────────────
const ORG_ROLES = ['ORGANIZER', 'RESIDENT', 'ADMIN']
const GUARD_ROLES = ['GUARD', 'RESIDENTIAL_GUARD', 'ADMIN']

// ── Page loader ───────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-950">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" aria-label="Loading" />
    </div>
  )
}

function RootRedirect() {
  const { isAuthenticated, role } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role === 'GUARD' || role === 'RESIDENTIAL_GUARD' || role === 'guard' || role === 'residential_guard') return <Navigate to="/guard/dashboard" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Root */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register-guard" element={<RegisterGuard />} />

          {/* ── Organizer / Resident / Admin ── */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={ORG_ROLES}><MainDashboard /></ProtectedRoute>} />
          <Route path="/spaces" element={<ProtectedRoute allowedRoles={ORG_ROLES}><SpaceList /></ProtectedRoute>} />
          <Route path="/spaces/:spaceId/guards" element={<ProtectedRoute allowedRoles={ORG_ROLES}><SpaceGuards /></ProtectedRoute>} />
          <Route path="/invites" element={<ProtectedRoute allowedRoles={ORG_ROLES}><InviteList /></ProtectedRoute>} />
          <Route path="/occupancy" element={<ProtectedRoute allowedRoles={ORG_ROLES}><OccupancyDashboard /></ProtectedRoute>} />
          <Route path="/walkins" element={<ProtectedRoute allowedRoles={ORG_ROLES}><WalkInApprovals /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute allowedRoles={ORG_ROLES}><DocumentUpload /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute allowedRoles={ORG_ROLES}><Analytics /></ProtectedRoute>} />
          <Route path="/notifications" element={<Navigate to="/dashboard" replace />} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={ORG_ROLES}><Settings /></ProtectedRoute>} />

          {/* ── Guard ── */}
          <Route path="/guard/dashboard" element={<ProtectedRoute allowedRoles={GUARD_ROLES}><GuardDashboard /></ProtectedRoute>} />
          <Route path="/guard/entry" element={<ProtectedRoute allowedRoles={GUARD_ROLES}><EntryScan /></ProtectedRoute>} />
          <Route path="/guard/exit" element={<ProtectedRoute allowedRoles={GUARD_ROLES}><ExitScan /></ProtectedRoute>} />
          <Route path="/guard/walkin" element={<ProtectedRoute allowedRoles={GUARD_ROLES}><WalkInForm /></ProtectedRoute>} />
          <Route path="/guard/notifications" element={<Navigate to="/guard/dashboard" replace />} />

          {/* ── Visitor — token-based, no JWT ── */}
          <Route path="/invite/*" element={<InviteLanding />} />
          <Route path="/visitor/pass" element={<VisitorRoute><VisitorPass /></VisitorRoute>} />
          <Route path="/visitor/details" element={<VisitorRoute><VisitorDetails /></VisitorRoute>} />
          <Route path="/visitor/chat" element={<VisitorRoute><VisitorChat /></VisitorRoute>} />

          {/* Legacy redirects */}
          <Route path="/organizer/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/pass" element={<Navigate to="/login" replace />} />
          <Route path="/chat" element={<Navigate to="/login" replace />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  )
}
