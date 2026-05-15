import { cn } from '@/lib/utils'
import { IconButton } from './IconButton'

/**
 * QuickActionBar - 4-5 large icon buttons for primary Guard actions
 * Mobile-first, full-width layout
 * Primary use: Guard dashboard quick access to scan entry, scan exit, walk-in, etc.
 */
function QuickActionBar({ actions, className, gridCols = 'grid-cols-2 sm:grid-cols-4', ...props }) {
  if (!actions || actions.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'grid gap-4 w-full',
        gridCols,
        className
      )}
      {...props}
    >
      {actions.map((action, index) => (
        <div key={index} className="flex justify-center">
          <IconButton
            icon={action.icon}
            label={action.label}
            variant={action.variant || 'default'}
            size="lg"
            onClick={action.onClick}
            disabled={action.disabled}
            className={action.className}
            aria-label={action.label}
          />
        </div>
      ))}
    </div>
  )
}

export { QuickActionBar }
