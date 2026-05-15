import { cn } from '@/lib/utils'

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'blue', className }) {
  const colors = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
    yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-100' },
  }

  const c = colors[color] || colors.blue

  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow',
        c.border,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </span>
              <span className="text-xs text-gray-400">vs last hour</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('rounded-xl p-3', c.bg)}>
            <Icon className={cn('h-6 w-6', c.icon)} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  )
}

export { StatCard }
