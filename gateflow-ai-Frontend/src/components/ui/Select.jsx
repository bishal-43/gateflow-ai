import { cn } from '@/lib/utils'
import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm',
          'text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  )
})

Select.displayName = 'Select'

export { Select }
