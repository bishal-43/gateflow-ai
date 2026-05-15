import { cn, getInitials } from '@/lib/utils'

function Avatar({ name, src, size = 'default', className }) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    default: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  }

  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-red-500',
  ]

  const colorIndex = name
    ? name.charCodeAt(0) % colors.length
    : 0

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white',
        sizes[size],
        colors[colorIndex],
        className
      )}
      aria-label={name || 'User avatar'}
    >
      {getInitials(name)}
    </div>
  )
}

export { Avatar }
