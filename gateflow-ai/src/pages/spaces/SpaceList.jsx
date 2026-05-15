/**
 * SpaceList.jsx — Space management page.
 *
 * Data sources:
 *  - GET    /spaces        → useSpaces
 *  - POST   /spaces        → useCreateSpace
 *  - PUT    /spaces/:id    → useUpdateSpace
 *  - DELETE /spaces/:id    → useDeleteSpace
 *
 * Roles: ORGANIZER | RESIDENT | ADMIN
 */

import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
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
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ErrorState, EmptyState } from '@/components/ui/ErrorState'
import { useSpaces, useCreateSpace, useUpdateSpace, useDeleteSpace } from '@/hooks/useSpaces'
import { useDocuments, useDeleteDocument } from '@/hooks/useDocuments'
import { useSpaceStore } from '@/store/spaceStore'
import documentService from '@/services/documentService'
import ragService from '@/services/ragService'
import { cn } from '@/lib/utils'
import {
  Building2, Plus, MapPin, Calendar, Activity,
  CheckCircle, Edit, Trash2, Shield, Upload, FileText, X,
} from 'lucide-react'

// ── Validation ────────────────────────────────────────────────────────────────
const baseSchema = {
  name: z.string().min(1, 'Name is required').max(200),
  type: z.enum(['EVENT', 'APARTMENT']),
  venue: z.string().max(300).optional().or(z.literal('')),
  address: z.string().max(400).optional().or(z.literal('')),
  walkin_enabled: z.boolean(),
  max_guests: z.coerce.number().positive().optional().or(z.literal('')),
}

const spaceSchema = z.discriminatedUnion('type', [
  z.object({
    ...baseSchema,
    type: z.literal('EVENT'),
    start_time: z.string().min(1, 'Start time required for events'),
    end_time: z.string().min(1, 'End time required for events'),
  }),
  z.object({
    ...baseSchema,
    type: z.literal('APARTMENT'),
    start_time: z.string().optional().or(z.literal('')),
    end_time: z.string().optional().or(z.literal('')),
    address: z.string().min(1, 'Address required for apartments'),
  }),
])

export default function SpaceList() {
  const { data: spaces = [], isLoading, error, refetch } = useSpaces()
  const createSpace = useCreateSpace()
  const updateSpace = useUpdateSpace()
  const deleteSpace = useDeleteSpace()
  const { activeSpaceId, setActiveSpaceId } = useSpaceStore()

  const [showModal, setShowModal] = useState(false)
  const [editingSpace, setEditingSpace] = useState(null)
  const [filterType, setFilterType] = useState('all')

  // Document upload state — files selected before/during space save
  const [pendingFiles, setPendingFiles] = useState([])   // File[] waiting to upload
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const fileInputRef = useRef(null)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(spaceSchema),
    defaultValues: { type: 'EVENT', walkin_enabled: true },
  })
  const spaceType = watch('type')

  const filtered = spaces.filter((s) => filterType === 'all' || s.type === filterType)

  const openCreate = () => {
    setEditingSpace(null)
    setPendingFiles([])
    reset({ type: 'EVENT', walkin_enabled: true })
    setShowModal(true)
  }

  const openEdit = (space) => {
    setEditingSpace(space)
    setPendingFiles([])
    reset({
      name: space.name,
      type: space.type,
      venue: space.venue ?? '',
      address: space.address ?? '',
      walkin_enabled: space.walkin_enabled,
      max_guests: space.max_guests ?? '',
      start_time: space.start_time ? space.start_time.slice(0, 16) : '',
      end_time: space.end_time ? space.end_time.slice(0, 16) : '',
    })
    setShowModal(true)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type === 'application/pdf')
    setPendingFiles((prev) => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (idx) => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))

  /** Upload pending files to the given spaceId (fire-and-forget for RAG) */
  const uploadPendingFiles = async (spaceId) => {
    if (!pendingFiles.length) return
    setUploadingDocs(true)
    try {
      for (const file of pendingFiles) {
        try {
          await documentService.upload(spaceId, file)
          // RAG ingestion — non-blocking
          ragService.ingestDocument(spaceId, file).catch((e) =>
            console.warn('[RAG] Ingest failed (non-blocking):', e.message)
          )
        } catch (e) {
          console.warn('[DOC] Upload failed for', file.name, e.message)
        }
      }
    } finally {
      setUploadingDocs(false)
      setPendingFiles([])
    }
  }

  const onSubmit = (data) => {
    const payload = {
      ...data,
      venue: data.venue || null,
      address: data.address || null,
      max_guests: data.max_guests || null,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
    }

    if (editingSpace) {
      updateSpace.mutate({ spaceId: editingSpace.id, data: payload }, {
        onSuccess: async () => {
          await uploadPendingFiles(editingSpace.id)
          setShowModal(false)
        },
      })
    } else {
      createSpace.mutate(payload, {
        onSuccess: async (newSpace) => {
          // newSpace is the SpaceResponse — id is at newSpace.id
          await uploadPendingFiles(newSpace.id)
          setShowModal(false)
        },
      })
    }
  }

  const handleDelete = (space) => {
    if (window.confirm(`Delete "${space.name}"? This cannot be undone.`)) {
      deleteSpace.mutate(space.id)
    }
  }

  const isSaving = createSpace.isPending || updateSpace.isPending || uploadingDocs

  return (
    <DashboardLayout title="Spaces" subtitle="Manage your events and apartment spaces">
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
            {['all', 'EVENT', 'APARTMENT'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
                  filterType === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900',
                )}
                aria-pressed={filterType === t}
              >
                {t === 'all' ? 'All' : t === 'EVENT' ? '🎪 Events' : '🏢 Apartments'}
              </button>
            ))}
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Space
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} title="Failed to load spaces" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No spaces yet"
            description="Create your first event or apartment space to get started."
            action={<Button onClick={openCreate}><Plus className="h-4 w-4" />Create Space</Button>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((space) => (
              <SpaceCard
                key={space.id}
                space={space}
                isActive={space.id === activeSpaceId}
                onEdit={() => openEdit(space)}
                onDelete={() => handleDelete(space)}
                onSetActive={() => setActiveSpaceId(space.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSpace ? 'Edit Space' : 'Create New Space'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="spaceName" className="mb-1.5 block text-sm font-medium text-gray-700">
                Space Name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <Input id="spaceName" {...register('name')} placeholder="e.g. Tech Summit 2026" />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="spaceType" className="mb-1.5 block text-sm font-medium text-gray-700">Type</label>
              <Select id="spaceType" {...register('type')}>
                <option value="EVENT">Event</option>
                <option value="APARTMENT">Apartment / Gated Community</option>
              </Select>
            </div>

            <div>
              <label htmlFor="spaceVenue" className="mb-1.5 block text-sm font-medium text-gray-700">Venue</label>
              <Input id="spaceVenue" {...register('venue')} placeholder="Venue name" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="spaceAddress" className="mb-1.5 block text-sm font-medium text-gray-700">
                Address {spaceType === 'APARTMENT' && <span className="text-red-500" aria-hidden="true">*</span>}
              </label>
              <Input id="spaceAddress" {...register('address')} placeholder="Full address" />
              {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
            </div>

            {spaceType === 'EVENT' && (
              <>
                <div>
                  <label htmlFor="startTime" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Start Time <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <Input id="startTime" type="datetime-local" {...register('start_time')} />
                  {errors.start_time && <p className="mt-1 text-xs text-red-500">{errors.start_time.message}</p>}
                </div>
                <div>
                  <label htmlFor="endTime" className="mb-1.5 block text-sm font-medium text-gray-700">
                    End Time <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <Input id="endTime" type="datetime-local" {...register('end_time')} />
                  {errors.end_time && <p className="mt-1 text-xs text-red-500">{errors.end_time.message}</p>}
                </div>
                <div>
                  <label htmlFor="maxGuests" className="mb-1.5 block text-sm font-medium text-gray-700">Guest Limit</label>
                  <Input id="maxGuests" type="number" {...register('max_guests')} placeholder="500" min={1} />
                </div>
              </>
            )}

            <div className="sm:col-span-2 flex items-center gap-3 rounded-xl bg-gray-50 p-4">
              <input
                id="walkinEnabled"
                type="checkbox"
                {...register('walkin_enabled')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="walkinEnabled" className="text-sm font-medium text-gray-700">
                Allow Walk-in Visitors
              </label>
            </div>
          </div>

          {/* ── Document upload section ── */}
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  📄 Documents <span className="text-xs font-normal text-gray-400">(optional — PDF only, max 20 MB each)</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Uploaded PDFs power the AI chatbot for visitors of this space.
                </p>
              </div>
              <label className="cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="sr-only"
                  aria-label="Add PDF documents"
                />
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  Add PDFs
                </span>
              </label>
            </div>

            {/* Existing docs (edit mode) */}
            {editingSpace && <SpaceDocList spaceId={editingSpace.id} />}

            {/* Pending new files */}
            {pendingFiles.length > 0 && (
              <ul className="space-y-1.5">
                {pendingFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" aria-hidden="true" />
                      <span className="truncate text-gray-700">{f.name}</span>
                      <span className="text-gray-400 flex-shrink-0">({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0"
                      aria-label={`Remove ${f.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {uploadingDocs && (
              <p className="text-xs text-blue-600 flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
                Uploading documents…
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingSpace ? 'Update Space' : 'Create Space'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}

/** Shows existing documents for a space in edit mode with delete capability */
function SpaceDocList({ spaceId }) {
  const { data: docs = [], isLoading } = useDocuments(spaceId)
  const deleteDoc = useDeleteDocument(spaceId)
  if (isLoading) return <p className="text-xs text-gray-400">Loading documents…</p>
  if (!docs.length) return null
  return (
    <ul className="space-y-1.5">
      {docs.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" aria-hidden="true" />
            <span className="truncate text-gray-700">{doc.filename}</span>
            <span className="text-gray-400 flex-shrink-0">({(doc.file_size / 1024 / 1024).toFixed(1)} MB)</span>
          </div>
          <button
            type="button"
            onClick={() => deleteDoc.mutate(doc.id)}
            disabled={deleteDoc.isPending}
            className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0"
            aria-label={`Delete ${doc.filename}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ul>
  )
}

function SpaceCard({ space, isActive, onEdit, onDelete, onSetActive }) {
  const isEvent = space.type === 'EVENT'
  return (
    <Card className={cn('hover:shadow-md transition-shadow', isActive && 'ring-2 ring-blue-500')}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">{isEvent ? '🎪' : '🏢'}</span>
            <div>
              <h3 className="font-semibold text-gray-900 leading-tight">{space.name}</h3>
              <Badge variant={isEvent ? 'default' : 'success'} className="mt-0.5 text-xs">{space.type}</Badge>
            </div>
          </div>
          {isActive && <Badge variant="success">Active</Badge>}
        </div>

        <div className="space-y-1.5 text-sm text-gray-600 mb-4">
          {(space.venue || space.address) && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{space.venue ?? space.address}</span>
            </div>
          )}
          {isEvent && space.start_time && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
              <span>{new Date(space.start_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
            <span>{space.is_active ? 'Active' : 'Inactive'} • Walk-ins {space.walkin_enabled ? 'on' : 'off'}</span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="flex-1 min-w-[88px]" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </Button>
          <Link
            to={`/spaces/${space.id}/guards`}
            className="inline-flex flex-1 min-w-[88px] h-8 px-3 text-xs font-medium items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
          >
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            Guards
          </Link>
          {!isActive && (
            <Button size="sm" className="flex-1 min-w-[88px]" onClick={onSetActive}>
              <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Set Active
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={onDelete} className="text-red-500 hover:bg-red-50" aria-label="Delete space">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
