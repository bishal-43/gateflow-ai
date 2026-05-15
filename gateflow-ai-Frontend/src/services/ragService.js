/**
 * ragService.js — RAG / AI microservice client (gateflow-ai-main).
 *
 * This service is COMPLETELY INDEPENDENT from the backend.
 * It communicates with the FastAPI RAG service running on VITE_RAG_BASE_URL.
 *
 * RAG API endpoints (from gateflow-ai-main/GateFlow AI/main.py):
 *   POST   /ingest/{event_id}          — Organizer uploads PDF (ORGANIZER only)
 *   GET    /ask/{event_id}?q=&debug=   — Guest asks a question
 *   GET    /events                     — List all ingested events
 *   DELETE /events/{event_id}          — Remove event data
 *   GET    /cache/{event_id}/stats     — Cache stats
 *   DELETE /cache/{event_id}           — Clear cache
 *   GET    /                           — Health check
 *
 * Design decisions:
 *  - Uses ragAxiosInstance (separate timeout, no auth header injection)
 *  - Graceful degradation: all methods catch errors and return fallback shapes
 *  - event_id maps to space_id (the RAG service uses event_id as the namespace)
 *  - No streaming in current RAG version (synchronous LLM call)
 */

import ragApi from './http/ragAxiosInstance'

const ragService = {
  /**
   * Health check — use to detect if RAG service is available.
   * @returns {Promise<{ status: string, service: string, version: string }>}
   */
  health: () => ragApi.get('/').then((r) => r.data),

  /**
   * Organizer uploads a PDF for a space/event.
   * Automatically clears semantic cache on the RAG side.
   * @param {string} spaceId  — used as event_id in RAG service
   * @param {File} file       — PDF file
   * @param {(progress: number) => void} [onProgress]
   * @returns {Promise<IngestResponse>}
   */
  ingestDocument: (spaceId, file, onProgress) => {
    const form = new FormData()
    form.append('file', file)

    return ragApi
      .post(`/ingest/${spaceId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
          ? (e) => onProgress(Math.round((e.loaded * 100) / (e.total ?? 1)))
          : undefined,
      })
      .then((r) => r.data)
  },

  /**
   * Ask a question about a space/event.
   * Returns answer + cache_hit flag + optional debug metadata.
   *
   * @param {string} spaceId   — maps to event_id in RAG
   * @param {string} question
   * @param {boolean} [debug=false]
   * @returns {Promise<AskResponse>}
   */
  ask: (spaceId, question, debug = false) =>
    ragApi
      .get(`/ask/${spaceId}`, { params: { q: question, debug } })
      .then((r) => r.data),

  /**
   * List all event/space IDs that have ingested documents.
   * @returns {Promise<{ events: string[], count: number }>}
   */
  listEvents: () => ragApi.get('/events').then((r) => r.data),

  /**
   * Delete all RAG data for a space/event.
   * @param {string} spaceId
   * @returns {Promise<{ status: string, event_id: string }>}
   */
  deleteEvent: (spaceId) => ragApi.delete(`/events/${spaceId}`).then((r) => r.data),

  /**
   * Get semantic cache stats for a space/event.
   * @param {string} spaceId
   * @returns {Promise<object>}
   */
  getCacheStats: (spaceId) =>
    ragApi.get(`/cache/${spaceId}/stats`).then((r) => r.data),

  /**
   * Manually clear the semantic cache for a space/event.
   * @param {string} spaceId
   * @returns {Promise<{ status: string, event_id: string, deleted: number }>}
   */
  clearCache: (spaceId) =>
    ragApi.delete(`/cache/${spaceId}`).then((r) => r.data),
}

export default ragService
