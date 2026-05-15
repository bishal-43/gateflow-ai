import { cn } from '@/lib/utils'

/**
 * MetricCard - Large display card for key metrics
 * Icon-driven with large number and semantic color coding
 * Purpose: Dashboard occupancy, entry counts, overstay alerts
 * 
 * Accessibility Features:
 * - Semantic HTML with proper aria-label
 * - Color-coded with text fallback for visibility
 * - Loading state announced to screen readers
 * - Trend indicator with emoji for visual clarity
 */
function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  color = 'blue',
  trend,
  trendValue,
  loading = false,
  className,
  ...props
}) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      number: 'text-blue-900 dark:text-blue-100',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      number: 'text-green-900 dark:text-green-100',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      number: 'text-red-900 dark:text-red-100',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'text-amber-600 dark:text-amber-400',
      number: 'text-amber-900 dark:text-amber-100',
    },
  }

  const scheme = colorMap[color] || colorMap.blue

  const getTrendColor = () => {
    if (!trend) return ''
    return trend === 'up' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
  }

  // Build comprehensive aria-label for screen reader
  const ariaLabel = loading 
    ? `${title}, loading` 
    : `${title}: ${value}${unit ? ` ${unit}` : ''}${trend && trendValue ? `, ${trend === 'up' ? 'increased by' : 'decreased by'} ${trendValue}` : ''}`

  return (
    <div
      className={cn(
        'rounded-2xl border-2 p-4 sm:p-6 transition-all hover:shadow-md',
        scheme.bg,
        scheme.border,
        className
      )}
      role="status"
      aria-label={ariaLabel}
      aria-busy={loading}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            {loading ? (
              <div className="h-10 w-20 animate-pulse rounded-lg bg-gray-300 dark:bg-gray-700" aria-hidden="true" />
            ) : (
              <>
                <p className={cn('text-4xl sm:text-5xl font-black', scheme.number)}>
                  {value}
                </p>
                {unit && (
                  <p className={cn('text-sm sm:text-base font-semibold', scheme.icon)}>
                    {unit}
                  </p>
                )}
              </>
            )}
          </div>
          {trend && trendValue && (
            <div className={cn('mt-2 text-xs sm:text-sm font-semibold', getTrendColor())}>
              {trend === 'up' ? '📈' : '📉'} <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('rounded-xl p-3 sm:p-4 bg-white/50 dark:bg-black/20', scheme.bg)}>
            <Icon size={36} className={scheme.icon} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  )
}

export { MetricCard }
