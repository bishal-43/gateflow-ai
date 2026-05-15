/**
 * DocumentUpload.jsx — Document management page.
 *
 * Data sources:
 *  - GET    /documents/?space_id=    → useDocuments
 *  - POST   /documents/upload        → useUploadDocument (also ingests into RAG)
 *  - DELETE /documents/:id           → useDeleteDocument
 *  - GET    /cache/:spaceId/stats    → useRAGCacheStats (RAG service)
 *
 * Roles: ORGANIZER | ADMIN
 */

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { ErrorState, EmptyState } from '@/components/ui/ErrorState'
import { useDocuments, useUploadDocument, useDeleteDocument } from '@/hooks/useDocuments'
import { useRAGCacheStats } from '@/hooks/useRAG'
import { useSpaceStore } from '@/store/spaceStore'
import { env } from '@/config/env'
import { cn } from '@/lib/utils'
import { FileText, Upload, Trash2, Brain, File, Zap } from 'lucide-react'

export default function DocumentUpload() {
  const { activeSpaceId } = useSpaceStore()
  const { data: documents = [], isLoading, error, refetch } = useDocuments(activeSpaceId)
  const uploadDoc = useUploadDocument(activeSpaceId)
  const deleteDoc = useDeleteDocument(activeSpaceId)
  const { data: cacheStats } = useRAGCacheStats(activeSpaceId)

  const [dragging, setDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)

  const handleFiles = (files) => {
    const pdfs = Array.from(files).filter((f) => f.type === 'application/pdf')
    if (pdfs.length === 0) return

    pdfs.forEach((file) => {
      setUploadProgress(0)
      uploadDoc.mutate(
        { file, onProgress: setUploadProgress },
        { onSettled: () => setUploadProgress(null) },
      )
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleFileInput = (e) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  const handleDelete = (doc) => {
    if (window.confirm(`Delete "${doc.filename}"?`)) {
      deleteDoc.mutate(doc.id)
    }
  }

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <DashboardLayout title="Documents" subtitle="Upload event documents for AI knowledge base">
      <div className="space-y-6">
        {/* RAG info banner */}
        <div className="flex items-start gap-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <Brain className="h-8 w-8 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">AI Knowledge Base</h3>
            <p className="text-sm text-blue-100 mt-1">
              Uploaded PDFs are processed through the RAG pipeline — chunked, embedded, and stored in the vector database.
              Visitors can then ask the AI chatbot questions about your event.
            </p>
            {cacheStats && (
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-yellow-300" aria-hidden="true" />
                  {cacheStats.total ?? 0} cached answers
                </span>
                <span className="flex items-center gap-1.5">
                  <File className="h-4 w-4 text-blue-200" aria-hidden="true" />
                  {documents.length} documents
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Upload zone */}
        <Card>
          <CardContent className="p-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={cn(
                'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors',
                dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300',
              )}
              role="region"
              aria-label="File upload drop zone"
            >
              <Upload className={cn('h-12 w-12 mb-4', dragging ? 'text-blue-500' : 'text-gray-400')} aria-hidden="true" />
              <h3 className="text-lg font-semibold text-gray-700">
                {dragging ? 'Drop PDF files here' : 'Upload Event Documents'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Drag & drop PDF files, or click to browse</p>
              <p className="mt-1 text-xs text-gray-400">Max 20 MB per file • PDF only</p>

              {uploadProgress !== null && (
                <div className="mt-4 w-full max-w-xs">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                      role="progressbar"
                      aria-valuenow={uploadProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              )}

              <label className="mt-4 cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileInput}
                  className="sr-only"
                  aria-label="Upload PDF files"
                  disabled={uploadDoc.isPending}
                />
                <Button type="button" variant="outline" disabled={uploadDoc.isPending} asChild>
                  <span>
                    {uploadDoc.isPending ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-gray-700" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" aria-hidden="true" />
                        Choose Files
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Document list */}
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonTable rows={3} />
            ) : error ? (
              <ErrorState error={error} onRetry={refetch} title="Failed to load documents" />
            ) : documents.length === 0 ? (
              <EmptyState icon={FileText} title="No documents uploaded" description="Upload PDFs to power the AI chatbot." />
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                        <FileText className="h-5 w-5 text-red-500" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{doc.filename}</p>
                        <p className="text-xs text-gray-500">{formatBytes(doc.file_size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="success">Uploaded</Badge>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        aria-label={`Delete ${doc.filename}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
