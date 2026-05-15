/**
 * WalkInApprovals.jsx — Walk-in approval panel.
 *
 * Data sources:
 *  - GET  /walkins/pending?space_id=  → usePendingWalkins
 *  - POST /walkins/approve/:id        → useApproveWalkin  (body: { valid_from, valid_until })
 *  - POST /walkins/reject/:id         → useRejectWalkin
 *
 * Roles: ORGANIZER | ADMIN
 */

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState, EmptyState } from '@/components/ui/ErrorState'
import { usePendingWalkins, useApproveWalkin, useRejectWalkin } from '@/hooks/useWalkins'
import { useSpaceStore } from '@/store/spaceStore'
import { formatDateTime } from '@/lib/utils'
import { env } from '@/config/env'
import {
  CheckCircle, XCircle, Clock, QrCode,
  Image, User, Link, Copy, Phone, Calendar
} from 'lucide-react'
import { toast } from '@/components/ui/Toast'

/** Return a local datetime string suitable for <input type="datetime-local"> */
function toLocalInput(date) {
  const d = date ? new Date(date) : new Date()
  // Shift to local time and format as YYYY-MM-DDTHH:MM
  const offset = d.getTimezoneOffset() * 60_000
  return new Date(d - offset).toISOString().slice(0, 16)
}

/** Convert datetime-local string to ISO string with timezone offset */
function fromLocalInput(str) {
  if (!str) return null
  return new Date(str).toISOString()
}

export default function WalkInApprovals() {
  const { activeSpaceId } = useSpaceStore()
  const { data: walkins = [], isLoading, isFetching, error, refetch } = usePendingWalkins(activeSpaceId)
  const approveWalkin = useApproveWalkin()
  const rejectWalkin = useRejectWalkin()

  // Approve modal state
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [selectedApprove, setSelectedApprove] = useState(null)
  const [validFrom, setValidFrom]   = useState('')
  const [validUntil, setValidUntil] = useState('')

  // Reject modal state
  const [selectedWalkin, setSelectedWalkin] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  // Success banner
  const [approvedResult, setApprovedResult] = useState(null)

  const openApproveModal = (walkin) => {
    setSelectedApprove(walkin)
    setValidFrom(toLocalInput(null))                          // default: now
    setValidUntil(toLocalInput(new Date(Date.now() + 12 * 3600_000))) // default: +12h
    setShowApproveModal(true)
  }

  const handleApproveConfirm = () => {
    if (!selectedApprove) return
    const vf = fromLocalInput(validFrom)
    const vu = fromLocalInput(validUntil)
    if (vu && vf && new Date(vu) <= new Date(vf)) {
      toast('Valid until must be after valid from', 'error')
      return
    }
    approveWalkin.mutate(
      { walkinId: selectedApprove.id, validFrom: vf, validUntil: vu },
      {
        onSuccess: (result) => {
          setShowApproveModal(false)
          setSelectedApprove(null)
          setApprovedResult(result)
          setTimeout(() => setApprovedResult(null), 30_000)
        },
      },
    )
  }

  const handleRejectConfirm = () => {
    if (!selectedWalkin) return
    rejectWalkin.mutate(
      { walkinId: selectedWalkin.id, note: rejectNote },
      {
        onSuccess: () => {
          setShowRejectModal(false)
          setSelectedWalkin(null)
          setRejectNote('')
        },
      },
    )
  }

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link).catch(() => {})
    toast('Invite link copied', 'success')
  }

  return (
    <DashboardLayout
      title="Walk-in Approvals"
      subtitle={`${walkins.length} pending request${walkins.length !== 1 ? 's' : ''}`}
    >
      <div className="space-y-6">
        {!isLoading && isFetching && (
          <p className="text-center text-xs text-gray-500" aria-live="polite">Refreshing requests…</p>
        )}

        {/* ── Success Banner ── */}
        {approvedResult && (
          <div className="rounded-2xl border-2 border-green-400 bg-green-50 dark:bg-green-900/20 p-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-green-900 dark:text-green-100 text-lg">
                  ✓ {approvedResult.visitor_name} Approved
                </p>
                <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                  Valid {formatDateTime(approvedResult.valid_from)} → {formatDateTime(approvedResult.valid_until)}
                </p>

                {approvedResult.invite_link && (
                  <div className="mt-4 rounded-xl border border-green-300 bg-white dark:bg-green-950/40 p-3">
                    <p className="text-xs font-bold text-green-800 dark:text-green-200 mb-2 flex items-center gap-1">
                      <Link className="h-3 w-3" aria-hidden="true" />
                      Visitor invite link (share this)
                    </p>
                    <p className="text-xs break-all text-gray-700 dark:text-gray-300 mb-3 font-mono">
                      {approvedResult.invite_link}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleCopyLink(approvedResult.invite_link)}
                      >
                        <Copy className="h-3 w-3 mr-1" aria-hidden="true" />
                        Copy link
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(approvedResult.invite_link, '_blank', 'noopener')}
                      >
                        Open pass
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                  <QrCode className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                  <span>QR token: </span>
                  <span className="font-mono bg-green-100 dark:bg-green-800 px-2 py-0.5 rounded">
                    {approvedResult.qr_token}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setApprovedResult(null)}
                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 flex-shrink-0"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ── Pending list ── */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} title="Failed to load walk-in requests" />
        ) : walkins.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="No pending walk-ins"
            description="All requests have been processed. Great work!"
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {walkins.map((walkin) => (
              <WalkinCard
                key={walkin.id}
                walkin={walkin}
                onApprove={() => openApproveModal(walkin)}
                onReject={() => { setSelectedWalkin(walkin); setShowRejectModal(true) }}
                isApproving={approveWalkin.isPending && approveWalkin.variables?.walkinId === walkin.id}
                isRejecting={rejectWalkin.isPending && rejectWalkin.variables?.walkinId === walkin.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Approve Modal ── */}
      <Modal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)} title="Approve Walk-in" size="sm">
        <div className="p-6 space-y-5">
          {/* Visitor info */}
          <div className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-900/20 p-4 border-2 border-green-200 dark:border-green-800">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold text-green-900 dark:text-green-100">{selectedApprove?.visitor_name}</p>
              <p className="text-sm text-green-700 dark:text-green-200">Set the validity window for this pass</p>
            </div>
          </div>

          {/* Valid from */}
          <div>
            <label htmlFor="validFrom" className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Valid from
            </label>
            <input
              id="validFrom"
              type="datetime-local"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Valid until */}
          <div>
            <label htmlFor="validUntil" className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Valid until
            </label>
            <input
              id="validUntil"
              type="datetime-local"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              className="flex-1"
              onClick={handleApproveConfirm}
              disabled={approveWalkin.isPending || !validFrom || !validUntil}
            >
              {approveWalkin.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Approving…
                </span>
              ) : (
                <><CheckCircle className="h-4 w-4 mr-1" aria-hidden="true" />Approve & Generate QR</>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Reject Modal ── */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Walk-in" size="sm">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border-2 border-red-200 dark:border-red-800">
            <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold text-red-900 dark:text-red-100">{selectedWalkin?.visitor_name}</p>
              <p className="text-sm text-red-700 dark:text-red-200">Sure you want to reject?</p>
            </div>
          </div>
          <div>
            <label htmlFor="rejectNote" className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
              Reason (optional)
            </label>
            <textarea
              id="rejectNote"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              placeholder="Why are you rejecting this request?"
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleRejectConfirm}
              disabled={rejectWalkin.isPending}
            >
              {rejectWalkin.isPending ? 'Rejecting...' : '✗ Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

function WalkinCard({ walkin, onApprove, onReject, isApproving, isRejecting }) {
  const proofUrl = walkin.proof_image
    ? `${env.API_BASE_URL}/${walkin.proof_image}`
    : null

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all border-2 flex flex-col">
      <CardHeader className="pb-3 border-b-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 dark:text-white text-lg truncate">
                {walkin.visitor_name}
              </p>
              {walkin.visitor_phone && (
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" aria-hidden="true" />
                  {walkin.visitor_phone}
                </p>
              )}
            </div>
          </div>
          <StatusBadge status="pending" label="PENDING" size="sm" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{formatDateTime(walkin.created_at)}</span>
        </div>

        {walkin.reason && (
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 border-l-4 border-amber-500">
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">Reason</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{walkin.reason}</p>
          </div>
        )}

        <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden aspect-video flex items-center justify-center">
          {proofUrl ? (
            <img src={proofUrl} alt="Proof screenshot" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center py-4">
              <Image className="mx-auto h-8 w-8 text-gray-400 mb-1" aria-hidden="true" />
              <p className="text-xs text-gray-500">No proof image</p>
            </div>
          )}
        </div>
      </CardContent>

      <div className="border-t-2 p-4 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
        <Button
          variant="destructive"
          className="flex-1 h-12 font-bold"
          onClick={onReject}
          disabled={isApproving || isRejecting}
        >
          <XCircle className="h-5 w-5" aria-hidden="true" />
          Reject
        </Button>
        <Button
          variant="success"
          className="flex-1 h-12 font-bold"
          onClick={onApprove}
          disabled={isApproving || isRejecting}
        >
          {isApproving ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <CheckCircle className="h-5 w-5" aria-hidden="true" />
          )}
          Approve
        </Button>
      </div>
    </Card>
  )
}
