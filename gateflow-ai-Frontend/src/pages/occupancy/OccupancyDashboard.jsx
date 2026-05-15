/**
 * OccupancyDashboard.jsx — Live visitor tracking.
 *
 * Data sources:
 *  - GET /entry/active?space_id=    → useActiveVisitors
 *  - GET /overstay/active?space_id= → useOverstays
 *  - POST /overstay/resolve/:id     → useResolveOverstay
 *  - WS  /ws/dashboard/:id          → useDashboardWS
 *
 * Roles: ORGANIZER | RESIDENT | ADMIN
 */

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { SkeletonStats, SkeletonTable } from '@/components/ui/Skeleton'
import { ErrorState, EmptyState } from '@/components/ui/ErrorState'
import { useActiveVisitors } from '@/hooks/useEntry'
import { useOverstays, useResolveOverstay } from '@/hooks/useOverstays'
import { useDashboardWS } from '@/hooks/useDashboardWS'
import { useSpaceStore } from '@/store/spaceStore'
import { cn, formatDateTime, formatTime } from '@/lib/utils'
import {
  DoorOpen, DoorClosed, AlertTriangle, Clock, Activity
} from 'lucide-react'

const STATUS_CONFIG = {
  INSIDE: { color: 'bg-green-50 border-green-200 text-green-700', dot: 'bg-green-500', label: 'Inside' },
  EXITED: { color: 'bg-gray-50 border-gray-200 text-gray-600', dot: 'bg-gray-400', label: 'Exited' },
  OVERSTAYED: { color: 'bg-red-50 border-red-200 text-red-700', dot: 'bg-red-500', label: 'Overstayed' },
  ASSUMED_EXITED: { color: 'bg-yellow-50 border-yellow-200 text-yellow-700', dot: 'bg-yellow-500', label: 'Assumed Exited' },
}

export default function OccupancyDashboard() {
  const { activeSpaceId } = useSpaceStore()
  const [activeFilter, setActiveFilter] = useState('all')

  const { data: visitors = [], isLoading: visitorsLoading, error: visitorsError, refetch } = useActiveVisitors(activeSpaceId)
  const { data: overstays = [], isLoading: overstaysLoading } = useOverstays(activeSpaceId)
  const resolveOverstay = useResolveOverstay(activeSpaceId)

  // Real-time updates
  useDashboardWS(activeSpaceId)

  const inside = visitors.filter((v) => v.status === 'INSIDE').length
  const overstayCount = overstays.length

  const filtered = activeFilter === 'all'
    ? visitors
    : visitors.filter((v) => v.status === activeFilter)

  return (
    <DashboardLayout title="Occupancy" subtitle="Live visitor tracking and occupancy management">
      <div className="space-y-6">
        {/* Stats */}
        {visitorsLoading ? (
          <SkeletonStats count={3} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Currently Inside" value={inside} icon={DoorOpen} color="green" />
            <StatCard title="Overstays" value={overstayCount} icon={AlertTriangle} color={overstayCount > 0 ? 'red' : 'green'} />
            <StatCard title="Total Scanned" value={visitors.length} icon={Activity} color="blue" />
          </div>
        )}

        {/* Overstay alerts */}
        {overstays.length > 0 && (
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5" role="alert">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 text-lg">
                  {overstays.length} Overstay Alert{overstays.length > 1 ? 's' : ''}
                </h3>
                <div className="mt-3 space-y-2">
                  {overstays.map((s) => (
                    <div key={s.session_id} className="flex items-center justify-between rounded-xl bg-white border border-red-200 px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{s.visitor_name}</p>
                        <p className="text-xs text-gray-500">
                          Entered: {formatTime(s.entry_time)}
                          {s.allowed_until && ` • Allowed until: ${formatTime(s.allowed_until)}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => resolveOverstay.mutate(s.session_id)}
                        disabled={resolveOverstay.isPending}
                      >
                        Resolve
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All', count: visitors.length },
            { id: 'INSIDE', label: 'Inside', count: inside },
            { id: 'OVERSTAYED', label: 'Overstayed', count: overstayCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                activeFilter === tab.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
              )}
              aria-pressed={activeFilter === tab.id}
            >
              {tab.label}
              <span className={cn(
                'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold',
                activeFilter === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600',
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Visitor list */}
        <Card>
          <CardContent className="p-0">
            {visitorsLoading ? (
              <div className="p-6"><SkeletonTable rows={5} /></div>
            ) : visitorsError ? (
              <ErrorState error={visitorsError} onRetry={refetch} title="Failed to load visitors" />
            ) : filtered.length === 0 ? (
              <EmptyState icon={Activity} title="No visitors" description="No visitors match this filter." />
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((visitor) => {
                  const cfg = STATUS_CONFIG[visitor.status] ?? STATUS_CONFIG.INSIDE
                  return (
                    <div key={visitor.session_id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                            {visitor.visitor_name.charAt(0).toUpperCase()}
                          </div>
                          <span className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white', cfg.dot)} aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{visitor.visitor_name}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            {visitor.gate_id && <span>Gate: {visitor.gate_id}</span>}
                            <span>In: {formatTime(visitor.entry_time)}</span>
                            {visitor.allowed_until && <span>Until: {formatTime(visitor.allowed_until)}</span>}
                          </div>
                        </div>
                      </div>
                      <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold', cfg.color)}>
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
