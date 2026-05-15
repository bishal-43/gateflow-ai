/**
 * Map backend scan errors to short, plain-language text for guards.
 */

export function friendlyScanError(message) {
  const m = String(message ?? '').toLowerCase()
  if (m.includes('not assigned')) {
    return 'You cannot scan here. Ask the organizer to add you as a guard for this place.'
  }
  if (m.includes('already been used') || m.includes('already used') || m.includes('duplicate scan')) {
    return 'This pass was already used.'
  }
  if (m.includes('retry shortly') || m.includes('being processed')) {
    return 'Please wait a moment and try again.'
  }
  if (m.includes('revoked')) return 'This pass was cancelled.'
  if (m.includes('expired') || m.includes('valid until')) return 'This pass is not valid anymore.'
  if (m.includes('not yet allowed') || m.includes('valid from')) return 'Entry is not open yet for this pass.'
  if (m.includes('already exited')) return 'This visitor already left.'
  if (m.includes('no entry session') || m.includes('not have entered')) {
    return 'No check-in found — use entry scan first.'
  }
  if (m.includes('not found')) return 'QR not recognized.'
  if (m.includes('duplicate entry')) return 'Already checked in with this pass.'
  return String(message || 'Scan failed.')
}
