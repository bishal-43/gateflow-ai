import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { ErrorState, EmptyState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Users, Clock, Shield, BarChart3, Building2 } from 'lucide-react'
import { useSpaceStore } from '@/store/spaceStore'
import dashboardService from '@/services/dashboardService'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280']

export default function Analytics() {
  const { activeSpaceId } = useSpaceStore()
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['dashboard', 'analytics', activeSpaceId],
    queryFn: () => dashboardService.getAnalytics(activeSpaceId),
    enabled: Boolean(activeSpaceId),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  if (!activeSpaceId) {
    return (
      <DashboardLayout title="Analytics" subtitle="Select a space from the header to load live metrics">
        <EmptyState
          icon={Building2}
          title="No space selected"
          description="Choose an active space to see entry volume, walk-ins, gate usage, and alerts from your database."
        />
      </DashboardLayout>
    )
  }

  if (isLoading && !data) {
    return (
      <DashboardLayout title="Analytics" subtitle="Loading space metrics…">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </DashboardLayout>
    )
  }

  if (error && !data) {
    return (
      <DashboardLayout title="Analytics" subtitle="Could not load metrics">
        <ErrorState error={error} onRetry={refetch} title="Failed to load analytics" />
      </DashboardLayout>
    )
  }

  const attendance = data?.attendance_by_hour ?? []
  const weekly = data?.weekly_approvals ?? []
  const gates = data?.gate_activity ?? []
  const rawReasons = (data?.walkin_by_reason ?? []).filter((r) => r.count > 0)
  const totalReason = rawReasons.reduce((s, r) => s + r.count, 0) || 1
  const walkinPie = rawReasons.map((r, i) => ({
    name: r.name,
    value: r.count,
    color: PIE_COLORS[i % PIE_COLORS.length],
    pct: Math.round((100 * r.count) / totalReason),
  }))

  const approvalLabel =
    data?.approval_rate_percent != null && !Number.isNaN(data.approval_rate_percent)
      ? `${data.approval_rate_percent}%`
      : '—'

  return (
    <DashboardLayout
      title="Analytics"
      subtitle="Live metrics from scans, walk-ins, and notifications for the selected space"
    >
      {isFetching && !isLoading && (
        <p className="mb-2 text-center text-xs text-gray-500" aria-live="polite">
          Updating charts…
        </p>
      )}
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Entries (24h)"
            value={String(data?.total_entries_24h ?? 0)}
            subtitle="QR scans recorded"
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Peak hour"
            value={data?.peak_hour_label ?? '—'}
            subtitle="Highest hourly volume (UTC)"
            icon={Clock}
            color="orange"
          />
          <StatCard
            title="Walk-in approval rate"
            value={approvalLabel}
            subtitle="Approved vs rejected (30 days)"
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="Security alerts"
            value={String(data?.security_alerts_7d ?? 0)}
            subtitle="Rejected QR events (7 days)"
            icon={Shield}
            color="red"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" aria-hidden="true" />
              Attendance by hour (last 24h, UTC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={attendance}>
                <defs>
                  <linearGradient id="gradAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="entries"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#gradAnalytics)"
                  name="Entries"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Walk-in reasons (30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              {walkinPie.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">No walk-in requests with reasons in this window.</p>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={220} className="max-w-[220px]">
                    <PieChart>
                      <Pie
                        data={walkinPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {walkinPie.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2 w-full">
                    {walkinPie.map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} aria-hidden="true" />
                          <span className="text-sm text-gray-600 truncate">{cat.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 flex-shrink-0 ml-2">
                          {cat.pct}% ({cat.value})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Walk-in decisions (last 7 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="approved" fill="#10b981" radius={[4, 4, 0, 0]} name="Approved" />
                  <Bar dataKey="rejected" fill="#ef4444" radius={[4, 4, 0, 0]} name="Rejected" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" aria-hidden="true" />
              Gate activity (last 7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gates.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">No gate-tagged entries in the last week.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={gates}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="gate" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="entries" fill="#3b82f6" radius={[4, 4, 0, 0]} name="All entries" />
                  <Bar dataKey="walkins" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Walk-in invites" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
