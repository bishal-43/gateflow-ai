import { Navigate } from 'react-router-dom'
import { useVisitorSessionStore } from '@/store/visitorSessionStore'

// Visitor routes don't require JWT — they require a loaded visitor session (token-based)
export function VisitorRoute({ children }) {
  const { isLoaded, inviteToken } = useVisitorSessionStore()

  if (!isLoaded || !inviteToken) {
    // No valid session — visitor must open their invite link
    return <Navigate to="/login" replace />
  }

  return children
}
