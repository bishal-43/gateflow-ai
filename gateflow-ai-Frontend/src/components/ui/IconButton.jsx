import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

/**
 * IconButton - Large, accessible button with icon and minimal label
 * Designed for touchscreen interaction (48px minimum)
 * Perfect for illiterate-friendly interfaces with primary visual communication
 * 
 * Accessibility Features:
 * - aria-label for screen readers
 * - Keyboard accessible (Tab, Enter, Space)
 * - Focus-visible ring for keyboard navigation
 * - aria-pressed for toggle states
 * - aria-busy for loading states
 */
const IconButton = forwardRef(
  ({
    icon: Icon,
    label,
    variant = 'default',
    size = 'lg',
    disabled = false,
    loading = false,
    pressed = undefined,
    ariaLabel,
    className,
    children,
    title,
    ...props
  }, ref) => {
    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
      success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500',
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
      warning: 'bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-400',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-400',
      outline: 'border-2 border-blue-600 bg-white text-blue-600 hover:bg-blue-50 focus-visible:ring-blue-500',
    }

    const sizes = {
      sm: 'h-12 w-12',
      md: 'h-14 w-14',
      lg: 'h-16 w-16',
      xl: 'h-20 w-20',
    }

    // Build descriptive aria-label
    const finalAriaLabel = ariaLabel || label || 'Action button'
    const accessibilityLabel = loading ? `${finalAriaLabel}, loading` : finalAriaLabel

    return (
      <div className="flex flex-col items-center gap-2">
        <button
          ref={ref}
          disabled={disabled || loading}
          className={cn(
            'inline-flex items-center justify-center rounded-2xl font-bold transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            'active:scale-95',
            variants[variant],
            sizes[size],
            className
          )}
          aria-label={accessibilityLabel}
          aria-pressed={typeof pressed === 'boolean' ? pressed : undefined}
          aria-busy={loading}
          aria-disabled={disabled || loading}
          title={title || label}
          {...props}
        >
          {Icon && <Icon size={size === 'xl' ? 32 : size === 'lg' ? 28 : 24} aria-hidden="true" />}
          {children}
        </button>
        {label && (
          <span 
            className="text-center text-xs font-semibold text-gray-700 dark:text-gray-300 max-w-16 leading-tight"
            aria-hidden="true"
          >
            {label}
          </span>
        )}
      </div>
    )
  }
)

IconButton.displayName = 'IconButton'

export { IconButton }
