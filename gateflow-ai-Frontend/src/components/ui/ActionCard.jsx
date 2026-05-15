import { cn } from '@/lib/utils'

/**
 * ActionCard - Large, tappable card for primary actions
 * Designed for mobile-first, big touch targets (48px+ minimum)
 * Shows icon + text with visual hierarchy for illiterate-friendly UI
 * 
 * Accessibility Features:
 * - Semantic button with large touch target
 * - Clear aria-label describing action
 * - aria-busy for loading states
 * - Focus-visible ring for keyboard navigation
 * - Loading state announced to screen readers
 */
function ActionCard({
  icon: Icon,
  title,
  subtitle,
  description,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  ariaLabel,
  className,
  ...props
}) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg',
    success: 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg',
    destructive: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-lg',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 hover:shadow-md',
    outline: 'border-2 border-blue-600 bg-white text-blue-600 hover:bg-blue-50 hover:shadow-md',
  }

  const sizes = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  // Build comprehensive aria-label
  const labelParts = [title, subtitle].filter(Boolean).join(', ')
  const finalAriaLabel = ariaLabel || labelParts || 'Action'
  const accessibilityLabel = loading ? `${finalAriaLabel}, loading` : finalAriaLabel

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'w-full rounded-2xl font-semibold transition-all active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900',
        'disabled:pointer-events-none disabled:opacity-50',
        'flex flex-col items-center justify-center gap-3 min-h-32 sm:min-h-40',
        variants[variant],
        sizes[size],
        className
      )}
      aria-label={accessibilityLabel}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {Icon && (
        <Icon
          size={size === 'lg' ? 48 : size === 'md' ? 40 : 32}
          className={loading ? 'animate-spin' : ''}
          aria-hidden="true"
        />
      )}
      <div className="text-center">
        <div className={`font-bold ${size === 'lg' ? 'text-2xl' : 'text-xl'}`}>
          {title}
        </div>
        {subtitle && (
          <div className={`mt-1 ${size === 'lg' ? 'text-base' : 'text-sm'}`}>
            {subtitle}
          </div>
        )}
      </div>
    </button>
  )
}

export { ActionCard }
