import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const variants = {
  default: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-400',
  ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400',
  link: 'text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-500',
  success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500',
  warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus-visible:ring-yellow-400',
}

const sizes = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
  'icon-sm': 'h-8 w-8',
}

const Button = forwardRef(
  ({ className, variant = 'default', size = 'default', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
