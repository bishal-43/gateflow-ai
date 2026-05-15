import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'
import { Button } from './Button'

/**
 * ErrorState — shown when a query fails.
 * Provides retry action and contextual message.
 */
export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  const isNetwork = !error?.status || error?.status === 0
  const is404 = error?.status === 404
  const is401 = error?.status === 401

  const Icon = isNetwork ? WifiOff : AlertTriangle
  const message = is404
    ? 'The requested resource was not found.'
    : is401
    ? 'Your session has expired. Please log in again.'
    : isNetwork
    ? 'Unable to reach the server. Check your connection.'
    : error?.message ?? 'An unexpected error occurred.'

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-4">
        <Icon className="h-7 w-7 text-red-500" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  )
}

/**
 * EmptyState — shown when a query succeeds but returns no data.
 */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
          <Icon className="h-7 w-7 text-gray-400" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
