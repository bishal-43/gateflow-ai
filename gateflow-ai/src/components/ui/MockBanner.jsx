/**
 * MockBanner — shown at the top of every page when VITE_MOCK_MODE=true.
 * Reminds developers they're viewing demo data, not live backend data.
 * Automatically hidden in production (VITE_MOCK_MODE=false).
 */

import { env } from '@/config/env'
import { FlaskConical } from 'lucide-react'

export function MockBanner() {
  if (!env.MOCK_MODE) return null

  return (
    <div
      className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-xs font-semibold text-amber-900"
      role="status"
      aria-label="Demo mode active"
    >
      <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
      DEMO MODE — Using mock data. Set VITE_MOCK_MODE=false to connect to the real backend.
    </div>
  )
}
