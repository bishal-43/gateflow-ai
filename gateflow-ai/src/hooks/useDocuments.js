/**
 * useDocuments.js — Document management hooks.
 * Handles both backend storage AND RAG ingestion.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import documentService from '@/services/documentService'
import ragService from '@/services/ragService'
import { toast } from '@/components/ui/Toast'

export const DOCS_KEY = (spaceId) => ['documents', spaceId]

export function useDocuments(spaceId) {
  return useQuery({
    queryKey: DOCS_KEY(spaceId),
    queryFn: () => documentService.list(spaceId),
    enabled: !!spaceId,
    staleTime: 60_000,
    select: (data) => data.documents ?? [],
  })
}

/**
 * Upload to backend storage AND ingest into RAG pipeline.
 * Both operations run independently — RAG failure doesn't block backend upload.
 */
export function useUploadDocument(spaceId) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, onProgress }) => {
      // 1. Upload to backend (stores file, creates DB record)
      const doc = await documentService.upload(spaceId, file, onProgress)

      // 2. Ingest into RAG pipeline (fire-and-forget — don't block on failure)
      ragService.ingestDocument(spaceId, file).catch((err) => {
        console.warn('[RAG] Ingest failed (non-blocking):', err.message)
      })

      return doc
    },
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: DOCS_KEY(spaceId) })
      toast(`${doc.filename} uploaded and queued for AI processing`, 'success')
    },
    onError: (err) => toast(err.message, 'error'),
  })
}

export function useDeleteDocument(spaceId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: documentService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOCS_KEY(spaceId) })
      toast('Document removed', 'info')
    },
    onError: (err) => toast(err.message, 'error'),
  })
}
