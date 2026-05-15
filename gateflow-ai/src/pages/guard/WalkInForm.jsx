/**
 * WalkInForm.jsx — Guard walk-in request form.
 *
 * API: POST /walkins/request (multipart/form-data)
 * Fields: space_id, visitor_name, visitor_phone?, reason?, proof_image?
 *
 * Roles: GUARD | ADMIN
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { useCreateWalkin, usePendingWalkins } from '@/hooks/useWalkins'
import { useSpaces } from '@/hooks/useSpaces'
import { useSpaceStore } from '@/store/spaceStore'
import { cn, formatDateTime } from '@/lib/utils'
import { UserPlus, Upload, Clock, User, Image } from 'lucide-react'

const walkinSchema = z.object({
  visitor_name: z.string().min(1, 'Visitor name is required').max(200),
  visitor_phone: z.string().max(20).optional().or(z.literal('')),
  reason: z.string().max(500).optional().or(z.literal('')),
  space_id: z.string().uuid('Select a space'),
  gate: z.string().min(1),
})

const GATES = ['Gate 1', 'Gate 2', 'Gate 3', 'Main Gate', 'Back Gate']

export default function WalkInForm() {
  const { activeSpaceId } = useSpaceStore()
  const { data: spaces = [] } = useSpaces()
  const createWalkin = useCreateWalkin()

  const [activeTab, setActiveTab] = useState('form')
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [submittedRequests, setSubmittedRequests] = useState([])

  // Poll pending walk-ins so guard can see when their request gets approved/rejected
  const { data: pendingWalkins = [] } = usePendingWalkins(activeSpaceId)

  // Detect when a submitted request is no longer pending (approved or rejected)
  useEffect(() => {
    if (!pendingWalkins.length && !submittedRequests.length) return
    const pendingIds = new Set(pendingWalkins.map((w) => w.id))
    setSubmittedRequests((prev) =>
      prev.map((req) => {
        if (req.status === 'PENDING' && !pendingIds.has(req.id)) {
          // No longer in pending list — organizer processed it
          return { ...req, status: 'APPROVED' }
        }
        return req
      }),
    )
  }, [pendingWalkins]) // eslint-disable-line react-hooks/exhaustive-deps

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(walkinSchema),
    defaultValues: {
      space_id: activeSpaceId ?? '',
      gate: 'Gate 1',
    },
  })

  const handleProofUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setProofFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setProofPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const onSubmit = (data) => {
    createWalkin.mutate(
      {
        space_id: data.space_id,
        visitor_name: data.visitor_name,
        visitor_phone: data.visitor_phone || undefined,
        reason: data.reason || undefined,
        proof_image: proofFile ?? undefined,
      },
      {
        onSuccess: (result) => {
          setSubmittedRequests((prev) => [result, ...prev])
          reset({ space_id: activeSpaceId ?? '', gate: 'Gate 1' })
          setProofFile(null)
          setProofPreview(null)
        },
      },
    )
  }

  return (
    <DashboardLayout title="Walk-In" subtitle="Register walk-in visitors for organizer approval">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
          {[
            { id: 'form', label: 'New Request' },
            { id: 'history', label: `Submitted (${submittedRequests.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900',
              )}
              aria-pressed={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'form' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Visitor Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                    {/* Visitor name */}
                    <div>
                      <label htmlFor="visitorName" className="mb-1.5 block text-sm font-medium text-gray-700">
                        Visitor Name <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                        <Input id="visitorName" {...register('visitor_name')} placeholder="Full name" className="pl-9" />
                      </div>
                      {errors.visitor_name && <p className="mt-1 text-xs text-red-500">{errors.visitor_name.message}</p>}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="visitorPhone" className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
                        <Input id="visitorPhone" type="tel" {...register('visitor_phone')} placeholder="+91 XXXXX XXXXX" />
                      </div>
                      <div>
                        <label htmlFor="walkinGate" className="mb-1.5 block text-sm font-medium text-gray-700">Gate</label>
                        <Select id="walkinGate" {...register('gate')}>
                          {GATES.map((g) => <option key={g} value={g}>{g}</option>)}
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="walkinSpace" className="mb-1.5 block text-sm font-medium text-gray-700">
                        Space <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <Select id="walkinSpace" {...register('space_id')}>
                        <option value="">Select space...</option>
                        {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </Select>
                      {errors.space_id && <p className="mt-1 text-xs text-red-500">{errors.space_id.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-gray-700">Reason</label>
                      <textarea
                        id="reason"
                        {...register('reason')}
                        rows={2}
                        placeholder="Purpose of visit..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {/* Proof image upload */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Proof Screenshot
                        <span className="ml-1 text-xs text-gray-400">(WhatsApp invite, receipt, or invitation)</span>
                      </label>
                      <div className={cn(
                        'rounded-xl border-2 border-dashed p-5 text-center transition-colors',
                        proofPreview ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300',
                      )}>
                        {proofPreview ? (
                          <div className="space-y-3">
                            <img src={proofPreview} alt="Proof" className="mx-auto max-h-40 rounded-lg object-contain" />
                            <button type="button" onClick={() => { setProofFile(null); setProofPreview(null) }} className="text-xs text-red-500 hover:text-red-700">
                              Remove
                            </button>
                          </div>
                        ) : (
                          <>
                            <Image className="mx-auto h-8 w-8 text-gray-400 mb-2" aria-hidden="true" />
                            <p className="text-sm text-gray-600">Upload proof screenshot</p>
                            <label className="mt-3 inline-block cursor-pointer">
                              <input type="file" accept="image/*" onChange={handleProofUpload} className="sr-only" aria-label="Upload proof image" />
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                <Upload className="h-4 w-4" aria-hidden="true" />
                                Choose File
                              </span>
                            </label>
                          </>
                        )}
                      </div>
                    </div>

                    {createWalkin.error && (
                      <p className="text-sm text-red-500">{createWalkin.error.message}</p>
                    )}

                    <Button type="submit" className="w-full" size="lg" disabled={createWalkin.isPending}>
                      {createWalkin.isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Submitting...
                        </span>
                      ) : (
                        <><UserPlus className="h-5 w-5" aria-hidden="true" />Submit Walk-In Request</>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">How it works</h3>
                  <ol className="space-y-3 text-sm text-gray-600">
                    {['Enter visitor name', 'Upload proof screenshot', 'Submit to organizer', 'Wait for approval', 'If approved, temp QR is generated'].map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {submittedRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Clock className="h-12 w-12 text-gray-300 mb-3" aria-hidden="true" />
                  <p className="text-gray-500">No requests submitted this session</p>
                </CardContent>
              </Card>
            ) : (
              submittedRequests.map((w) => (
                <Card key={w.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
                          <User className="h-5 w-5 text-blue-600" aria-hidden="true" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{w.visitor_name}</p>
                            {w.status === 'APPROVED' ? (
                              <Badge variant="success">APPROVED</Badge>
                            ) : (
                              <Badge variant="warning">PENDING</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(w.created_at)}</p>
                          {w.reason && <p className="text-xs text-gray-600 mt-1">{w.reason}</p>}
                          {w.status === 'APPROVED' && (
                            <p className="text-xs text-green-700 mt-2 font-medium">
                              ✓ Approved — organizer has the invite link to share with the visitor.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
