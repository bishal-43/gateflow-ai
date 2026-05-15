/**
 * useRAG.js — RAG / AI microservice hooks.
 *
 * Completely isolated from backend hooks.
 * Handles: ask questions, health check, cache stats.
 * Graceful degradation: if RAG is down, UI shows fallback message.
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import ragService from '@/services/ragService'
import api from '@/services/http/axiosInstance'

export const RAG_KEY = 'rag'

/**
 * Check if the RAG service is available.
 * Used to show/hide AI features gracefully.
 */
export function useRAGHealth() {
  return useQuery({
    queryKey: [RAG_KEY, 'health'],
    queryFn: ragService.health,
    staleTime: 60_000,
    retry: 1,
    // Don't throw — just return error state
    throwOnError: false,
  })
}

/**
 * Ask a question via the BACKEND proxy (POST /chat/ask).
 * Backend validates the invite token and derives space_id server-side.
 * Expired / revoked invite → backend returns 400/401 → chat blocked.
 *
 * @returns mutation with mutate({ token, question })
 */
export function useChatAsk() {
  return useMutation({
    mutationFn: ({ token, question }) =>
      api.post('/chat/ask', { token, question }).then((r) => r.data),
    throwOnError: false,
  })
}

/**
 * Ask a question directly to the RAG service (organizer/admin use only).
 * Visitors should use useChatAsk() instead.
 */
export function useAskRAG() {
  return useMutation({
    mutationFn: ({ spaceId, question, debug = false }) =>
      ragService.ask(spaceId, question, debug),
    // No toast on error — caller handles graceful fallback
    throwOnError: false,
  })
}

/**
 * Get cache stats for a space (admin/organizer use).
 */
export function useRAGCacheStats(spaceId) {
  return useQuery({
    queryKey: [RAG_KEY, 'cache', spaceId],
    queryFn: () => ragService.getCacheStats(spaceId),
    enabled: !!spaceId,
    staleTime: 30_000,
    throwOnError: false,
  })
}

/**
 * Ingest a document into the RAG pipeline.
 */
export function useRAGIngest() {
  return useMutation({
    mutationFn: ({ spaceId, file, onProgress }) =>
      ragService.ingestDocument(spaceId, file, onProgress),
    throwOnError: false,
  })
}
