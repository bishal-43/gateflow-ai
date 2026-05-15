/**
 * GuardDashboard.jsx — Guard operational dashboard (Redesigned for Phase 2).
 *
 * Data sources:
 *  - GET /entry/active?space_id=  → useActiveVisitors
 *  - GET /walkins/pending          → usePendingWalkins
 *  - WS  /ws/dashboard/:id         → useDashboardWS
 *
 * Roles: GUARD | ADMIN
 */

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MetricCard } from '@/components/ui/MetricCard'
import { QuickActionBar } from '@/components/ui/QuickActionBar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useActiveVisitors } from '@/hooks/useEntry'
import { usePendingWalkins } from '@/hooks/useWalkins'
import { useDashboardWS } from '@/hooks/useDashboardWS'
import { useSpaceStore } from '@/store/spaceStore'
import { useSpaces } from '@/hooks/useSpaces'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import {
  DoorOpen, DoorClosed, UserPlus, AlertTriangle,
  Clock,
} from 'lucide-react'
import { formatTime } from '@/lib/utils'

export default function GuardDashboard() {
  const navigate = useNavigate()
  const { activeSpaceId, setActiveSpaceId } = useSpaceStore()
  const { data: spaces = [] } = useSpaces()

  useEffect(() => {
    if (!spaces.length) return
    const valid = activeSpaceId && spaces.some((s) => s.id === activeSpaceId)
    if (!valid) setActiveSpaceId(spaces[0].id)
  }, [spaces, activeSpaceId, setActiveSpaceId])

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) ?? spaces[0] ?? null
  const spaceId = activeSpace?.id ?? null

  const { data: visitors = [], isLoading } = useActiveVisitors(spaceId)
  const { data: pendingWalkins = [] } = usePendingWalkins(spaceId)

  useDashboardWS(spaceId)

  const inside = visitors.filter((v) => v.status === 'INSIDE').length
  const overstayed = visitors.filter((v) => v.status === 'OVERSTAYED').length
  const recentVisitors = visitors.slice(0, 8)

  // Quick action buttons for Guard
  const quickActions = [
    {
      icon: DoorOpen,
      label: 'Entry',
      variant: 'success',
      onClick: () => navigate('/guard/entry'),
    },
    {
      icon: DoorClosed,
      label: 'Exit',
      variant: 'destructive',
      onClick: () => navigate('/guard/exit'),
    },
    {
      icon: UserPlus,
      label: 'Walk-In',
      variant: 'warning',
      onClick: () => navigate('/guard/walkin'),
    },
  ]

  return (
    <DashboardLayout title="Guard Dashboard" subtitle={activeSpace?.name ?? 'No active space'}>
      <div className="space-y-6">
        
        {/* Quick Action Bar - Primary Interface */}
        <div>
          <QuickActionBar 
            actions={quickActions}
            gridCols="grid-cols-2 sm:grid-cols-3"
          />
        </div>

        {/* Key Metrics - Large Cards */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard 
              title="Inside" 
              value={inside} 
              icon={DoorOpen}
              color="green"
              unit="guests"
            />
            <MetricCard 
              title="Exited" 
              value={visitors.filter((v) => v.status === 'EXITED').length} 
              icon={DoorClosed}
              color="blue"
              unit="guests"
            />
            <MetricCard 
              title="Overstays" 
              value={overstayed}
              icon={AlertTriangle}
              color={overstayed > 0 ? 'red' : 'green'}
              unit="alerts"
            />
            <MetricCard 
              title="Pending" 
              value={pendingWalkins.length}
              icon={Clock}
              color="amber"
              unit="approval"
            />
          </div>
        )}

        {/* Active Visitors List */}
        {recentVisitors.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Currently Inside ({inside})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentVisitors.map((v) => (
                  <div 
                    key={v.session_id} 
                    className="flex items-center justify-between rounded-2xl border-2 border-green-200 bg-green-50 p-4 hover:bg-green-100 transition-colors dark:bg-green-900/20 dark:border-green-800"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        {v.visitor_name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        📍 {v.gate_id || 'Gate'} • ⏱️ {formatTime(v.entry_time)}
                      </p>
                    </div>
                    <StatusBadge 
                      status={v.status === 'OVERSTAYED' ? 'overstayed' : 'inside'}
                      className="ml-2 flex-shrink-0"
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Walk-ins Alert */}
        {pendingWalkins.length > 0 && (
          <Card className="border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20">
            <CardHeader>
              <CardTitle className="text-amber-900 dark:text-amber-100 flex items-center gap-2 text-lg">
                <Clock className="h-6 w-6 shrink-0" aria-hidden />
                {pendingWalkins.length} waiting for organizer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base text-amber-950 dark:text-amber-100 leading-relaxed">
                Only an organizer can approve walk-ins. Use the <span className="font-semibold">bell icon</span> at the top of the screen to see updates when something changes.
              </p>
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardLayout>
  )
}
