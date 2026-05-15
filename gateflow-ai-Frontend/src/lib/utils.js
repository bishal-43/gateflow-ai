import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/** All user-visible times use Asia/Kolkata (IST). Backend remains UTC. */
const IST = { timeZone: 'Asia/Kolkata' }

export function formatDate(date) {
  if (date == null) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...IST,
  }).format(new Date(date))
}

export function formatTime(date) {
  if (date == null) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...IST,
  }).format(new Date(date))
}

/** e.g. 14 May 2026, 7:30 PM IST */
export function formatDateTime(date) {
  if (date == null) return '—'
  const d = new Date(date)
  const datePart = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...IST,
  }).format(d)
  const timePart = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...IST,
  }).format(d)
  return `${datePart}, ${timePart} IST`
}

export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9).toUpperCase()
}

export function getStatusColor(status) {
  const map = {
    valid: 'text-green-600 bg-green-50 border-green-200',
    vip: 'text-purple-600 bg-purple-50 border-purple-200',
    temp: 'text-blue-600 bg-blue-50 border-blue-200',
    invalid: 'text-red-600 bg-red-50 border-red-200',
    duplicate: 'text-orange-600 bg-orange-50 border-orange-200',
    expired: 'text-gray-600 bg-gray-50 border-gray-200',
    revoked: 'text-red-700 bg-red-100 border-red-300',
    pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    approved: 'text-green-600 bg-green-50 border-green-200',
    rejected: 'text-red-600 bg-red-50 border-red-200',
    urgent: 'text-red-600 bg-red-50 border-red-200',
    important: 'text-orange-600 bg-orange-50 border-orange-200',
    normal: 'text-blue-600 bg-blue-50 border-blue-200',
    spam: 'text-gray-600 bg-gray-50 border-gray-200',
  }
  return map[status?.toLowerCase()] || 'text-gray-600 bg-gray-50 border-gray-200'
}

export function getCategoryIcon(category) {
  const map = {
    Relative: '👨‍👩‍👧',
    Friend: '👥',
    Delivery: '📦',
    Vendor: '🏪',
    'Service Staff': '🔧',
    Emergency: '🚨',
    Other: '👤',
  }
  return map[category] || '👤'
}
