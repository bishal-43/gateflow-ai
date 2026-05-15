import { create } from 'zustand'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { useEffect } from 'react'

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString()
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, toast.duration || 4000)
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export function toast(message, type = 'info', duration = 4000) {
  useToastStore.getState().addToast({ message, type, duration })
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const styles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const iconStyles = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
}

function ToastItem({ toast, onRemove }) {
  const Icon = icons[toast.type] || Info

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 shadow-lg slide-in max-w-sm',
        styles[toast.type]
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', iconStyles[toast.type])} aria-hidden="true" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 rounded p-0.5 hover:bg-black/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  )
}
