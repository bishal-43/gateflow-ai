/**
 * VisitorPass.jsx — Visitor digital QR pass (Redesigned for Phase 3).
 *
 * Data: visitorSessionStore (from InviteLanding). On mount we refetch
 * GET /visitor/invite/:token so the QR survives bad/stale persisted sessions.
 */

import { useEffect, useRef, useState } from 'react'
import { VisitorLayout } from '@/components/layout/VisitorLayout'
import { useVisitorSessionStore } from '@/store/visitorSessionStore'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { toast } from '@/components/ui/Toast'
import { formatDateTime } from '@/lib/utils'
import { useOpenInvite } from '@/hooks/useVisitor'
import { Download, Share2 } from 'lucide-react'

const TYPE_ICONS = {
  EVENT_GUEST: '🎉',
  APARTMENT_VISITOR: '🏠',
  VENDOR: '📦',
  SERVICE: '🔧',
  WALKIN: '🚶',
}

const TYPE_LABELS = {
  EVENT_GUEST: 'Event Guest',
  APARTMENT_VISITOR: 'Apartment Visitor',
  VENDOR: 'Vendor',
  SERVICE: 'Service',
  WALKIN: 'Walk-in Pass',
}

/** Strip ``data:image/png;base64,`` if present; remove whitespace (JSON / copy-paste). */
function normalizePngBase64(b64) {
  if (!b64 || typeof b64 !== 'string') return null
  let s = b64.trim().replace(/\s/g, '')
  const dataPrefix = /^data:image\/png;base64,/i
  while (dataPrefix.test(s)) s = s.replace(dataPrefix, '')
  return s.length > 0 ? s : null
}

/** Valid ``<img src>`` for a PNG QR from the API. */
function qrImageDataUrl(b64) {
  const raw = normalizePngBase64(b64)
  if (!raw) return null
  return `data:image/png;base64,${raw}`
}

export default function VisitorPass() {
  const session = useVisitorSessionStore()
  const inviteToken = useVisitorSessionStore((s) => s.inviteToken)
  const loadSession = useVisitorSessionStore((s) => s.loadSession)
  const { data: freshInvite, refetch, isFetching, isPending } = useOpenInvite(inviteToken)

  const [imgBroken, setImgBroken] = useState(false)
  const qrRefetchCount = useRef(0)

  useEffect(() => {
    if (!freshInvite || !inviteToken) return
    loadSession(inviteToken, freshInvite)
  }, [freshInvite, inviteToken, loadSession])

  useEffect(() => {
    setImgBroken(false)
    qrRefetchCount.current = 0
  }, [session.qrCodeB64])

  const isExpired = session.validUntil && new Date(session.validUntil) < new Date()
  const icon = TYPE_ICONS[session.inviteType] ?? '👤'
  const qrSrc = qrImageDataUrl(session.qrCodeB64)

  const handleDownload = () => {
    const href = qrSrc
    if (!href) return
    const link = document.createElement('a')
    link.href = href
    link.download = `gateflow-pass-${session.visitorName?.replace(/\s+/g, '-')}.png`
    link.click()
    toast('✓ Pass downloaded', 'success')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ 
        title: 'My GateFlow Pass', 
        text: `My visitor pass for ${session.space?.name}`,
        url: window.location.href 
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast('✓ Link copied', 'success')
    }
  }

  return (
    <VisitorLayout title="Your Pass">
      {isFetching && !isPending && (
        <p className="mb-2 text-center text-xs text-amber-700 bg-amber-50 rounded-lg py-1.5" aria-live="polite">
          Syncing with server…
        </p>
      )}
      <div className="space-y-6 max-w-lg mx-auto">
        
        {/* Status Badge */}
        {isExpired && (
          <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-center">
            <p className="text-lg font-bold text-red-700">⚠️ Pass Expired</p>
            <p className="text-sm text-red-600 mt-1">This pass is no longer valid</p>
          </div>
        )}

        {/* Pass Card - Large QR */}
        <div className="rounded-3xl overflow-hidden shadow-2xl border-2 border-blue-200">
          
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white text-center">
            <div className="text-4xl mb-2">{icon}</div>
            <h2 className="text-3xl font-black">{session.visitorName}</h2>
            <p className="text-sm text-blue-100 mt-2">
              {TYPE_LABELS[session.inviteType] ?? 'Visitor Pass'}
            </p>
          </div>

          {/* Large QR Code */}
          <div className="bg-white p-6 sm:p-8 flex flex-col items-center">
            <p className="text-center text-sm font-bold text-gray-600 mb-4">📱 Your Entry Pass</p>
            {qrSrc && !imgBroken ? (
              <img
                src={qrSrc}
                alt={`QR code for ${session.visitorName}`}
                className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl border-4 border-gray-100 shadow-lg"
                onError={() => {
                  setImgBroken(true)
                  if (qrRefetchCount.current < 2) {
                    qrRefetchCount.current += 1
                    refetch()
                  }
                }}
              />
            ) : (
              <div
                className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl bg-gray-200 flex items-center justify-center"
                role="img"
                aria-label={`QR code for ${session.visitorName}`}
              >
                <div className="text-center px-2">
                  <div className="text-4xl mb-2">📲</div>
                  <p className="text-sm text-gray-500">
                    {imgBroken ? 'Could not load QR — retrying…' : 'Loading pass…'}
                  </p>
                </div>
              </div>
            )}

              {isExpired && (
                <div className="absolute mt-20 rounded-full bg-red-500/90 px-6 py-2 text-white font-bold text-lg">
                  EXPIRED
                </div>
              )}

            {/* Info Grid */}
            <div className="w-full grid grid-cols-1 gap-3 border-t-2 pt-6 mt-6">
              {session.space && (
                <div className="flex items-center gap-4 rounded-xl bg-blue-50 p-4">
                  <span className="text-2xl">📍</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-blue-600 uppercase">Location</p>
                    <p className="text-lg font-bold text-gray-900">{session.space.name}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4 rounded-xl bg-green-50 p-4">
                <span className="text-2xl">✓</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-green-600 uppercase">Valid From</p>
                  <p className="text-base font-bold text-gray-900">{formatDateTime(session.validFrom)}</p>
                </div>
              </div>

              <div className={`flex items-center gap-4 rounded-xl p-4 ${isExpired ? 'bg-red-50' : 'bg-amber-50'}`}>
                <span className="text-2xl">{isExpired ? '❌' : '⏰'}</span>
                <div className="flex-1">
                  <p className={`text-xs font-bold uppercase ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                    Valid Until
                  </p>
                  <p className={`text-base font-bold ${isExpired ? 'text-red-700' : 'text-gray-900'}`}>
                    {formatDateTime(session.validUntil)}
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="w-full mt-6 text-center">
              <p className="text-xs font-bold text-gray-600 px-4">
                🔒 Keep this pass safe. Present the QR code at the entrance.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Full Width */}
        <div className="space-y-3">
          <Button 
            onClick={handleDownload} 
            disabled={!qrSrc || isExpired}
            className="w-full h-14 font-bold text-base"
          >
            <Download className="h-5 w-5 mr-2" aria-hidden="true" />
            📥 Download Pass
          </Button>
          <Button 
            variant="secondary"
            onClick={handleShare}
            className="w-full h-14 font-bold text-base"
          >
            <Share2 className="h-5 w-5 mr-2" aria-hidden="true" />
            📤 Share Pass
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
          <div className="p-4 space-y-2 text-center">
            <p className="text-sm font-bold text-blue-900 dark:text-blue-100">✓ No Account Needed</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              This pass works with just your invite link. Keep the link secure!
            </p>
          </div>
        </Card>

      </div>
    </VisitorLayout>
  )
}
