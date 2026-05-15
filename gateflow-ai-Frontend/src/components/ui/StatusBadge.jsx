import { cn } from '@/lib/utils'

/**
 * StatusBadge - Icon + color indicator for visual status communication
 * Uses semantic colors: green=success, red=danger, amber=pending, blue=info
 * 
 * Accessibility Features:
 * - Semantic color coding with text fallback
 * - aria-label describes status meaning
 * - Icons have aria-hidden since text conveys meaning
 * - Color-blind safe with icon + text combination
 */
function StatusBadge({ status, icon: Icon, label, className, size = 'md' }) {
  const statusConfig = {
    inside: {
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-700 dark:text-green-100',
      icon: 'text-green-600 dark:text-green-300',
      color: 'green',
      ariaLabel: 'Inside facility',
    },
    exited: {
      bg: 'bg-blue-100 dark:bg-blue-900',
      text: 'text-blue-700 dark:text-blue-100',
      icon: 'text-blue-600 dark:text-blue-300',
      color: 'blue',
      ariaLabel: 'Exited facility',
    },
    overstayed: {
      bg: 'bg-red-100 dark:bg-red-900',
      text: 'text-red-700 dark:text-red-100',
      icon: 'text-red-600 dark:text-red-300',
      color: 'red',
      ariaLabel: 'Overstayed visit',
    },
    pending: {
      bg: 'bg-amber-100 dark:bg-amber-900',
      text: 'text-amber-700 dark:text-amber-100',
      icon: 'text-amber-600 dark:text-amber-300',
      color: 'amber',
      ariaLabel: 'Pending approval',
    },
    active: {
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-700 dark:text-green-100',
      icon: 'text-green-600 dark:text-green-300',
      color: 'green',
      ariaLabel: 'Active status',
    },
    inactive: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-100',
      icon: 'text-gray-600 dark:text-gray-300',
      color: 'gray',
      ariaLabel: 'Inactive status',
    },
    approved: {
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-700 dark:text-green-100',
      icon: 'text-green-600 dark:text-green-300',
      color: 'green',
      ariaLabel: 'Approved',
    },
    rejected: {
      bg: 'bg-red-100 dark:bg-red-900',
      text: 'text-red-700 dark:text-red-100',
      icon: 'text-red-600 dark:text-red-300',
      color: 'red',
      ariaLabel: 'Rejected',
    },
    error: {
      bg: 'bg-red-100 dark:bg-red-900',
      text: 'text-red-700 dark:text-red-100',
      icon: 'text-red-600 dark:text-red-300',
      color: 'red',
      ariaLabel: 'Error status',
    },
    warning: {
      bg: 'bg-amber-100 dark:bg-amber-900',
      text: 'text-amber-700 dark:text-amber-100',
      icon: 'text-amber-600 dark:text-amber-300',
      color: 'amber',
      ariaLabel: 'Warning status',
    },
  }

  const config = statusConfig[status] || statusConfig.pending
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 20

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-full font-semibold',
        config.bg,
        config.text,
        className
      )}
      role="status"
      aria-label={config.ariaLabel}
    >
      {Icon && <Icon size={iconSize} className={config.icon} aria-hidden="true" />}
      <span className={`text-${size === 'sm' ? 'xs' : 'sm'}`}>{label || status}</span>
    </div>
  )
}

export { StatusBadge }
