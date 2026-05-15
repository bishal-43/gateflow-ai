/**
 * InviteList.jsx — Invite management page.
 *
 * Data sources:
 *  - GET    /invites?space_id=&status=  → useInvites
 *  - POST   /invites                    → useCreateInvite
 *  - DELETE /invites/:id                → useRevokeInvite
 *
 * Roles: ORGANIZER | RESIDENT | ADMIN
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { ErrorState, EmptyState } from '@/components/ui/ErrorState'
import { useInvites, useCreateInvite, useRevokeInvite } from '@/hooks/useInvites'
import { useSpaces } from '@/hooks/useSpaces'
import { useSpaceStore } from '@/store/spaceStore'
import { toast } from '@/components/ui/Toast'
import { cn, formatDateTime } from '@/lib/utils'
import { Ticket, Plus, Search, Copy, Ban, Link, CheckCircle } from 'lucide-react'

// ── Invite type labels / variants ─────────────────────────────────────────────
const TYPE_LABELS = {
  EVENT_GUEST: 'Event Guest',
  APARTMENT_VISITOR: 'Apartment Visitor',
  VENDOR: 'Vendor',
  SERVICE: 'Service',
  WALKIN: 'Walk-in',
}
const TYPE_VARIANTS = {
  EVENT_GUEST: 'default',
  APARTMENT_VISITOR: 'success',
  VENDOR: 'warning',
  SERVICE: 'purple',
  WALKIN: 'secondary',
}
const STATUS_VARIANTS = {
  ACTIVE: 'success',
  USED: 'secondary',
  EXPIRED: 'secondary',
  REVOKED: 'destructive',
}

// ── Validation ────────────────────────────────────────────────────────────────
const inviteSchema = z.object({
  space_id: z.string().uuid('Select a space'),
  visitor_name: z.string().min(1, 'Name is required').max(200),
  invite_type: z.enum(['EVENT_GUEST', 'APARTMENT_VISITOR', 'VENDOR', 'SERVICE']),
  valid_from: z.string().min(1, 'Required'),
  valid_until: z.string().min(1, 'Required'),
  visitor_email: z.string().email().optional().or(z.literal('')),
  visitor_phone: z.string().max(20).optional().or(z.literal('')),
})

export default function InviteList() {
  const { activeSpaceId } = useSpaceStore()
  const { data: spaces = [] } = useSpaces()
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [createdInvite, setCreatedInvite] = useState(null)

  const { data, isLoading, error, refetch } = useInvites({ spaceId: activeSpaceId, status: filterStatus || undefined })
  const invites = data?.invites ?? []
  const createInvite = useCreateInvite()
  const revokeInvite = useRevokeInvite()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      space_id: activeSpaceId ?? '',
      invite_type: 'EVENT_GUEST',
    },
  })

  const filtered = invites.filter((i) =>
    i.visitor_name.toLowerCase().includes(search.toLowerCase()),
  )

  const onSubmit = (data) => {
    const payload = {
      ...data,
      visitor_email: data.visitor_email || null,
      visitor_phone: data.visitor_phone || null,
    }
    createInvite.mutate(payload, {
      onSuccess: (result) => {
        setCreatedInvite(result)
        reset()
      },
    })
  }

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link).catch(() => {})
    toast('Invite link copied', 'success')
  }

  const handleRevoke = (invite) => {
    if (window.confirm(`Revoke invite for ${invite.visitor_name}?`)) {
      revokeInvite.mutate(invite.id)
    }
  }

  return (
    <DashboardLayout title="Invites" subtitle="Create and manage visitor invite links">
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search visitors..."
                className="pl-9 w-52"
                aria-label="Search invites"
              />
            </div>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-36"
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="USED">Used</option>
              <option value="EXPIRED">Expired</option>
              <option value="REVOKED">Revoked</option>
            </Select>
          </div>
          <Button onClick={() => { setCreatedInvite(null); setShowModal(true) }}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Invite
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Total', value: invites.length, color: 'bg-blue-50 text-blue-700' },
            { label: 'Active', value: invites.filter((i) => i.status === 'ACTIVE').length, color: 'bg-green-50 text-green-700' },
            { label: 'Used', value: invites.filter((i) => i.status === 'USED').length, color: 'bg-gray-50 text-gray-700' },
            { label: 'Revoked', value: invites.filter((i) => i.status === 'REVOKED').length, color: 'bg-red-50 text-red-700' },
          ].map((s) => (
            <div key={s.label} className={cn('rounded-xl p-4', s.color)}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm font-medium opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6"><SkeletonTable rows={5} /></div>
            ) : error ? (
              <ErrorState error={error} onRetry={refetch} title="Failed to load invites" />
            ) : filtered.length === 0 ? (
              <EmptyState icon={Ticket} title="No invites found" description="Create your first invite to get started." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" role="table">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Visitor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Valid Until</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((invite) => (
                      <tr key={invite.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                              {invite.visitor_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{invite.visitor_name}</p>
                              {invite.visitor_email && (
                                <p className="text-xs text-gray-400">{invite.visitor_email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge variant={TYPE_VARIANTS[invite.invite_type] ?? 'secondary'}>
                            {TYPE_LABELS[invite.invite_type] ?? invite.invite_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_VARIANTS[invite.status] ?? 'secondary'}>
                            {invite.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-xs text-gray-500">{formatDateTime(invite.valid_until)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleCopyLink(invite.invite_link)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              title="Copy invite link"
                              aria-label={`Copy link for ${invite.visitor_name}`}
                            >
                              <Link className="h-4 w-4" aria-hidden="true" />
                            </button>
                            {invite.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleRevoke(invite)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Revoke invite"
                                aria-label={`Revoke invite for ${invite.visitor_name}`}
                              >
                                <Ban className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Invite Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setCreatedInvite(null) }}
        title="Create Invite"
      >
        {!createdInvite ? (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
            <div>
              <label htmlFor="visitorName" className="mb-1.5 block text-sm font-medium text-gray-700">
                Visitor Name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <Input id="visitorName" {...register('visitor_name')} placeholder="Full name" />
              {errors.visitor_name && <p className="mt-1 text-xs text-red-500">{errors.visitor_name.message}</p>}
            </div>

            <div>
              <label htmlFor="inviteType" className="mb-1.5 block text-sm font-medium text-gray-700">Invite Type</label>
              <Select id="inviteType" {...register('invite_type')}>
                <option value="EVENT_GUEST">Event Guest</option>
                <option value="APARTMENT_VISITOR">Apartment Visitor</option>
                <option value="VENDOR">Vendor</option>
                <option value="SERVICE">Service</option>
              </Select>
            </div>

            <div>
              <label htmlFor="inviteSpace" className="mb-1.5 block text-sm font-medium text-gray-700">
                Space <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <Select id="inviteSpace" {...register('space_id')}>
                <option value="">Select a space...</option>
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
              {errors.space_id && <p className="mt-1 text-xs text-red-500">{errors.space_id.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="validFrom" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Valid From <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <Input id="validFrom" type="datetime-local" {...register('valid_from')} />
                {errors.valid_from && <p className="mt-1 text-xs text-red-500">{errors.valid_from.message}</p>}
              </div>
              <div>
                <label htmlFor="validUntil" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Valid Until <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <Input id="validUntil" type="datetime-local" {...register('valid_until')} />
                {errors.valid_until && <p className="mt-1 text-xs text-red-500">{errors.valid_until.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="visitorEmail" className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                <Input id="visitorEmail" type="email" {...register('visitor_email')} placeholder="optional" />
              </div>
              <div>
                <label htmlFor="visitorPhone" className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
                <Input id="visitorPhone" {...register('visitor_phone')} placeholder="optional" />
              </div>
            </div>

            {createInvite.error && (
              <p className="text-sm text-red-500">{createInvite.error.message}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={createInvite.isPending}>
                {createInvite.isPending ? 'Creating...' : 'Create Invite'}
              </Button>
            </div>
          </form>
        ) : (
          /* Success — show generated invite */
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center text-center py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mb-3">
                <CheckCircle className="h-7 w-7 text-green-600" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Invite Created</h3>
              <p className="text-sm text-gray-500 mt-1">Share this link with {createdInvite.visitor_name}</p>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Invite Link</p>
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-sm font-mono text-blue-600 truncate">{createdInvite.invite_link}</p>
                  <button
                    onClick={() => handleCopyLink(createdInvite.invite_link)}
                    className="flex-shrink-0 rounded-lg p-1.5 hover:bg-gray-200 transition-colors"
                    aria-label="Copy invite link"
                  >
                    <Copy className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">QR Token</p>
                <p className="text-sm font-mono text-gray-700">{createdInvite.qr_token}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Valid Until</p>
                <p className="text-sm text-gray-700">{formatDateTime(createdInvite.valid_until)}</p>
              </div>
            </div>

            <Button className="w-full" onClick={() => { setShowModal(false); setCreatedInvite(null) }}>
              Done
            </Button>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
