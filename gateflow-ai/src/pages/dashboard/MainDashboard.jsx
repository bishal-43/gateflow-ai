/**
 * MainDashboard.jsx — Live operational dashboard (Redesigned for Phase 2).
 *
 * Data sources:
 *  - GET /dashboard/stats      → useDashboardStats
 *  - GET /dashboard/overstays  → useDashboardOverstays
 *  - GET /dashboard/entries    → useDashboardEntries
 *  - GET /walkins/pending      → usePendingWalkins
 *  - WS  /ws/dashboard/:id     → useDashboardWS (real-time updates)
 *  - “Check-ins today” = count from recent entries list (no chart; limit 20 may cap the number)
 *
 * Roles: ORGANIZER | RESIDENT | ADMIN
 */

import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MetricCard } from '@/components/ui/MetricCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton'
import { ErrorState, EmptyState } from '@/components/ui/ErrorState'
import { useDashboardStats, useDashboardEntries } from '@/hooks/useDashboard'
import { usePendingWalkins } from '@/hooks/useWalkins'
import { useOverstays } from '@/hooks/useOverstays'
import { useDashboardWS } from '@/hooks/useDashboardWS'
import { useSpaceStore } from '@/store/spaceStore'
import { useSpaces } from '@/hooks/useSpaces'
import { formatTime } from '@/lib/utils'
import {
  DoorOpen, DoorClosed, AlertTriangle, UserPlus,
  Activity, ArrowRight, Building2, Wifi, WifiOff, Clock,
} from 'lucide-react'

export default function MainDashboard() {
  const navigate = useNavigate()
  const { activeSpaceId, setActiveSpaceId } = useSpaceStore()

  // Fetch spaces to resolve active space name
  const { data: spaces = [] } = useSpaces()

  useEffect(() => {
    if (!spaces.length) return
    const valid = activeSpaceId && spaces.some((s) => s.id === activeSpaceId)
    if (!valid) setActiveSpaceId(spaces[0].id)
  }, [spaces, activeSpaceId, setActiveSpaceId])

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) ?? spaces[0] ?? null
  const spaceId = activeSpace?.id ?? null

  // Real-time WebSocket
  const { isConnected } = useDashboardWS(spaceId)

  // Server data
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats(spaceId)
  const { data: entries = [], isLoading: entriesLoading } = useDashboardEntries(spaceId, 20)
  const { data: pendingWalkins = [] } = usePendingWalkins(spaceId)
  const { data: overstays = [] } = useOverstays(spaceId)

  if (!spaceId) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Select a space to begin monitoring">
        <EmptyState
          icon={Building2}
          title="No active space"
          description="Create a space to start managing visitor access and occupancy."
          action={
            <Button onClick={() => navigate('/spaces')}>
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Create Space
            </Button>
          }
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={
        <span className="flex items-center gap-2 flex-wrap">
          {activeSpace?.name}
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
            {isConnected
              ? <><Wifi className="h-3 w-3" aria-hidden="true" /> Live</>
              : <><WifiOff className="h-3 w-3" aria-hidden="true" /> Polling</>
            }
          </span>
        </span>
      }
    >
      <div className="space-y-6">
        {/* Space selector */}
        {spaces.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-gray-700 dark:text-gray-300">Space</span>
            {spaces.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setActiveSpaceId(s.id)}
                className={`min-h-[44px] rounded-full px-4 py-2 text-base font-semibold transition-colors ${
                  s.id === spaceId
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Critical Metrics - Large Cards */}
        {statsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : statsError ? (
          <ErrorState error={statsError} onRetry={refetchStats} title="Failed to load stats" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard 
              title="Inside" 
              value={stats?.inside ?? 0} 
              icon={DoorOpen}
              color="green"
              unit="guests"
            />
            <MetricCard 
              title="Exited" 
              value={stats?.exited ?? 0} 
              icon={DoorClosed}
              color="blue"
              unit="guests"
            />
            <MetricCard
              title="Overstays"
              value={stats?.overstayed ?? 0}
              icon={AlertTriangle}
              color={stats?.overstayed > 0 ? 'red' : 'green'}
              unit={stats?.overstayed > 0 ? 'alerts' : 'ok'}
            />
            <MetricCard
              title="Pending"
              value={stats?.pending_walkins ?? 0}
              icon={Clock}
              color="amber"
              unit="approval"
            />
          </div>
        )}

        {/* Critical Alert Banner */}
        {overstays.length > 0 && (
          <div className="rounded-2xl border-2 border-red-400 bg-red-50 dark:bg-red-900/20 p-6" role="alert">
            <div className="flex items-start gap-4 justify-between flex-wrap">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <p className="font-bold text-red-900 dark:text-red-100 text-lg">
                    {overstays.length} Guest{overstays.length > 1 ? 's' : ''} Overstaying
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-200 mt-1">Check who is still inside</p>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={() => navigate('/occupancy')}
                className="min-h-[48px] whitespace-nowrap text-base font-semibold"
              >
                Who is inside <ArrowRight className="ml-2 h-5 w-5 shrink-0" aria-hidden />
              </Button>
            </div>
          </div>
        )}

        {/* Pending Walk-ins Alert */}
        {pendingWalkins.length > 0 && (
          <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/20 p-6">
            <div className="flex items-start gap-4 justify-between flex-wrap">
              <div className="flex items-start gap-4">
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <p className="font-bold text-amber-900 dark:text-amber-100 text-lg">
                    {pendingWalkins.length} Walk-in Approval{pendingWalkins.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">Tap to approve or reject</p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/walkins')}
                className="min-h-[48px] whitespace-nowrap text-base font-semibold"
              >
                Open walk-ins <ArrowRight className="ml-2 h-5 w-5 shrink-0" aria-hidden />
              </Button>
            </div>
          </div>
        )}

        {/* Today’s check-ins — single number (no chart) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              Check-ins today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entriesLoading ? (
              <Skeleton className="h-20 w-40 rounded-xl" />
            ) : (
              <div>
                <p className="text-5xl font-bold tabular-nums text-gray-900 dark:text-white">
                  {countEntriesToday(entries)}
                </p>
                <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
                  From recent arrivals for this space (same list as below).
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Space Summary + Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Space Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                {activeSpace?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats?.inside ?? 0}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">Inside</p>
                </div>
                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats?.exited ?? 0}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">Exited</p>
                </div>
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3">
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats?.total_entries ?? 0}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">Total</p>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-semibold">Type:</span> {activeSpace.type === 'EVENT' ? '🎉 Event' : '🏠 Apartment'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span className="font-semibold">📍 Location:</span> {activeSpace.venue ?? activeSpace.address ?? 'Not specified'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/invites')}
              className="w-full h-auto flex-col gap-2 py-4"
              size="lg"
            >
              <UserPlus className="h-6 w-6" />
              <span className="font-bold">Create Invite</span>
            </Button>
            <Button 
              onClick={() => navigate('/spaces')}
              variant="secondary"
              className="w-full h-auto flex-col gap-2 py-4"
              size="lg"
            >
              <Building2 className="h-6 w-6" />
              <span className="font-bold">Manage Spaces</span>
            </Button>
            <Button 
              onClick={() => navigate('/walkins')}
              variant="outline"
              className="w-full h-auto flex-col gap-2 py-4"
              size="lg"
            >
              <UserPlus className="h-6 w-6" />
              <span className="font-bold">Walk-in requests</span>
            </Button>
          </div>
        </div>

        {/* Recent Entries List */}
        {(entries.length > 0 || entriesLoading) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Entries</span>
                {!entriesLoading && (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/occupancy')}>
                    View All <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <SkeletonTable rows={6} />
              ) : (
                <div className="space-y-3">
                  {entries.slice(0, 6).map((e, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{e.visitor_name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          📍 {e.gate_id || 'Gate'} • ⏱️ {formatTime(e.entry_time)}
                        </p>
                      </div>
                      <StatusBadge 
                        status={e.status === 'OVERSTAYED' ? 'overstayed' : e.status === 'INSIDE' ? 'inside' : 'exited'}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardLayout>
  )
}

/** Count entry sessions whose entry_time is today (local calendar). */
function countEntriesToday(entries) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return entries.filter((e) => e?.entry_time && new Date(e.entry_time) >= start).length
}
