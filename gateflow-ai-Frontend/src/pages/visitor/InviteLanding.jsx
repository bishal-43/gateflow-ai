/**
 * InviteLanding.jsx — Opens visitor invite JWT and goes straight to the QR pass.
 *
 * Route: /invite/* (splat captures the full JWT, including dots)
 * API: GET /visitor/invite/:token → InviteOpenResponse (includes qr_code_b64)
 *
 * On success: persist session then replace-navigate to /visitor/pass (QR screen).
 */

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOpenInvite } from '@/hooks/useVisitor'
import { useVisitorSessionStore } from '@/store/visitorSessionStore'
import { Card } from '@/components/ui/Card'
import { formatDateTime } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const INVITE_ICONS = {
  EVENT_GUEST: '🎉',
  APARTMENT_VISITOR: '🏠',
  VENDOR: '📦',
  SERVICE: '🔧',
  WALKIN: '🚶',
}

export default function InviteLanding() {
  const params = useParams()
  const raw = params['*'] ?? ''
  const token = raw.replace(/^\/+|\/+$/g, '') || undefined
  const navigate = useNavigate()
  const { loadSession } = useVisitorSessionStore()

  const { data, isLoading, error } = useOpenInvite(token)

  useEffect(() => {
    if (!data || !token) return
    if (data.status === 'REVOKED' || data.status === 'EXPIRED') return
    const now = new Date()
    if (new Date(data.valid_until) < now) return
    loadSession(token, data)
    navigate('/visitor/pass', { replace: true })
  }, [data, token, loadSession, navigate])

  if (!token) {
    return (
      <InviteError
        emoji="🔗"
        title="Invalid link"
        message="This invite link is missing a token. Ask the organizer to resend your invite."
      />
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-900 dark:to-blue-950 flex items-center justify-center p-4">
        <div className="text-center flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" aria-hidden="true" />
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">Loading your pass…</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Contacting the server</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    const is404 = error.status === 404
    return (
      <InviteError
        emoji={is404 ? '🔗' : '❌'}
        title={is404 ? 'Invite not found' : 'Invalid invite'}
        message={
          is404
            ? 'This invite link does not exist or has been removed.'
            : error.message ?? 'This invite link is not valid.'
        }
      />
    )
  }

  if (!data) return null

  if (data.status === 'REVOKED') {
    return <InviteError emoji="🚫" title="Access revoked" message="This invite has been revoked by the organizer." />
  }

  const now = new Date()
  if (data.status === 'EXPIRED' || new Date(data.valid_until) < now) {
    return (
      <InviteError
        emoji="⏰"
        title="Invite expired"
        message="This invite link has expired. Please contact the organizer for a new invite."
      />
    )
  }

  const icon = INVITE_ICONS[data.invite_type] ?? '👤'
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-900 dark:to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="text-5xl" aria-hidden="true">{icon}</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Opening your QR pass…</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {data.visitor_name} · {data.space?.name} · until {formatDateTime(data.valid_until)}
        </p>
        <Card className="border border-gray-200 bg-white/80 p-4 text-left text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-400">
          If this page does not redirect, open the menu and tap <strong className="text-gray-800 dark:text-gray-200">My pass</strong>.
        </Card>
      </div>
    </div>
  )
}

function InviteError({ emoji, title, message }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-slate-900 dark:to-red-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="text-8xl mb-4" aria-hidden="true">{emoji}</div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 text-base font-medium">{message}</p>
        </div>
        <Card className="border-2 bg-gray-50 dark:bg-gray-900/20 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Need help? Contact the organizer.</p>
        </Card>
      </div>
    </div>
  )
}
