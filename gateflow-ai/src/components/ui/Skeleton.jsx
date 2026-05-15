import { cn } from '@/lib/utils'

/**
 * Skeleton — animated loading placeholder.
 * Use to prevent layout shift while data loads.
 * 
 * Accessibility Features:
 * - aria-hidden prevents placeholder from being announced
 * - Uses color-coded skeletons matching component themes
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 p-6 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

export function SkeletonMetric() {
  return (
    <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/20">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3 w-full">
          <Skeleton className="h-4 w-24" />
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
        <Skeleton className="h-16 w-16 rounded-xl flex-shrink-0" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg bg-gray-50 dark:bg-gray-900/20 px-4 py-3 border border-gray-200 dark:border-gray-700">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMetric key={i} />
      ))}
    </div>
  )
}
