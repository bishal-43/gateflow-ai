/**
 * documentService.js — Document upload microservice client.
 *
 * Maps to backend routes/document_routes.py:
 *   POST   /documents/upload?space_id=  → DocumentResponse   (ORGANIZER | ADMIN)
 *   GET    /documents/?space_id=        → DocumentListResponse
 *   DELETE /documents/:doc_id           → 204
 *
 * Upload uses multipart/form-data.
 */

import api from './http/axiosInstance'

const documentService = {
  /**
   * Upload a PDF document for a space.
   * @param {string} spaceId
   * @param {File} file
   * @param {(progress: number) => void} [onProgress]
   * @returns {Promise<DocumentResponse>}
   */
  upload: (spaceId, file, onProgress) => {
    const form = new FormData()
    form.append('file', file)

    return api
      .post('/documents/upload', form, {
        params: { space_id: spaceId },
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
          ? (e) => onProgress(Math.round((e.loaded * 100) / (e.total ?? 1)))
          : undefined,
      })
      .then((r) => r.data)
  },

  /**
   * List all documents for a space.
   * @param {string} spaceId
   * @returns {Promise<DocumentListResponse>}
   */
  list: (spaceId) =>
    api.get('/documents/', { params: { space_id: spaceId } }).then((r) => r.data),

  /**
   * Delete a document.
   * @param {string} docId
   * @returns {Promise<void>}
   */
  delete: (docId) => api.delete(`/documents/${docId}`).then((r) => r.data),
}

export default documentService
