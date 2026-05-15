import { cn } from '@/lib/utils'

/**
 * ProgressIndicator - Visual step flow without text
 * Icon-driven for illiterate-friendly UI
 * Shows current step and progress visually
 */
function ProgressIndicator({
  steps,
  currentStep = 1,
  onStepClick,
  className,
  ...props
}) {
  return (
    <div className={cn('flex items-center justify-between', className)} {...props}>
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isActive = stepNumber === currentStep
        const isCompleted = stepNumber < currentStep
        const Icon = step.icon

        return (
          <div key={stepNumber} className="flex flex-1 items-center">
            {/* Step Circle */}
            <button
              onClick={() => onStepClick?.(stepNumber)}
              disabled={!step.clickable && !isCompleted}
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full font-bold',
                'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                isCompleted && 'bg-green-600 text-white cursor-pointer hover:bg-green-700',
                isActive && 'bg-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-800',
                !isActive && !isCompleted && 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
                step.clickable || isCompleted ? 'cursor-pointer' : 'cursor-default disabled:opacity-50'
              )}
              aria-label={`Step ${stepNumber}: ${step.label}`}
              aria-current={isActive ? 'step' : undefined}
            >
              {Icon && <Icon size={24} />}
              {!Icon && (
                <span className="text-sm">
                  {isCompleted ? '✓' : stepNumber}
                </span>
              )}
            </button>

            {/* Connector Line */}
            {stepNumber < steps.length && (
              <div
                className={cn(
                  'flex-1 h-1 mx-2 rounded-full transition-colors',
                  stepNumber < currentStep ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export { ProgressIndicator }
