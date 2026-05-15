import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect } from 'react'

function Modal({ isOpen, onClose, title, children, className, size = 'default' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    default: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative w-full rounded-2xl border border-gray-800 bg-gray-900 text-gray-100 shadow-2xl fade-in',
          sizes[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {title && (
          <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
            <h2 id="modal-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export { Modal }
