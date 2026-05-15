/**
 * mockHandlers.js — Axios request interceptor for mock mode.
 *
 * When VITE_MOCK_MODE=true this intercepts every outgoing request and
 * returns realistic mock data instead of hitting the network.
 *
 * When VITE_MOCK_MODE=false (production / CI with real backend) this
 * module is never imported — zero runtime cost.
 */

import {
  MOCK_USERS, MOCK_SPACES, MOCK_INVITES, MOCK_ACTIVE_VISITORS,
  MOCK_STATS, MOCK_WALKINS, MOCK_NOTIFICATIONS, MOCK_DOCUMENTS,
  MOCK_OVERSTAYS, MOCK_INVITE_OPEN, MOCK_ENTRY_SCAN, MOCK_EXIT_SCAN,
  MOCK_RAG_RESPONSES,
} from './mockData'

/** Simulate realistic network latency */
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

/** Build a fake axios-style resolved response */
const ok = (data, status = 200) => ({
  data,
  status,
  statusText: status === 204 ? 'No Content' : 'OK',
  headers: {},
  config: {},
})

/**
 * Safely parse request body — handles all three cases axios can produce:
 *  1. JSON string  → parse it
 *  2. Plain object → return as-is (axios sometimes passes objects directly)
 *  3. FormData     → extract fields into a plain object
 *  4. null/undefined → return {}
 */
function parseBody(data) {
  if (!data) return {}

  // Already a plain object
  if (typeof data === 'object' && !(data instanceof FormData)) return data

  // FormData (multipart — walk-in request, document upload)
  if (data instanceof FormData) {
    const obj = {}
    data.forEach((value, key) => {
      // Skip File objects — we don't need them in mock
      if (!(value instanceof File)) obj[key] = value
    })
    return obj
  }

  // JSON string
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return {}
    }
  }

  return {}
}

/** In-memory state so mutations persist within the session */
let _spaces = [...MOCK_SPACES]
let _invites = [...MOCK_INVITES]
let _walkins = [...MOCK_WALKINS]
let _notifications = [...MOCK_NOTIFICATIONS]
let _documents = [...MOCK_DOCUMENTS]
let _visitors = [...MOCK_ACTIVE_VISITORS]

/** space_id → { id, email, full_name }[] */
let _guardsBySpace = {
  'sp-001': [
    {
      id: MOCK_USERS.guard.id,
      email: MOCK_USERS.guard.email,
      full_name: MOCK_USERS.guard.full_name,
    },
  ],
}

/**
 * Match a request and return mock data.
 * Returns null if no mock matches (falls through to real network).
 */
export async function handleMockRequest(config) {
  const method = config.method?.toLowerCase()
  const url = config.url ?? ''

  await delay(250 + Math.random() * 200)

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (url.includes('/auth/login') && method === 'post') {
    const body = parseBody(config.data)
    const roleMap = {
      'organizer@gateflow.ai': 'organizer',
      'resident@gateflow.ai': 'resident',
      'guard@gateflow.ai': 'guard',
      'resguard@gateflow.ai': 'residential_guard',
      'admin@gateflow.ai': 'admin',
    }
    const roleKey = roleMap[body.email]
    if (!roleKey || body.password !== 'demo1234') {
      throw { message: 'Invalid email or password', status: 401 }
    }
    const user = MOCK_USERS[roleKey]
    return ok({
      access_token: `mock-access-${roleKey}-token`,
      refresh_token: `mock-refresh-${roleKey}-token`,
      token_type: 'bearer',
      role: user.role,
      user,
    })
  }

  if (url.includes('/auth/register') && method === 'post') {
    const body = parseBody(config.data)
    const role = (body.role ?? 'ORGANIZER').toString().toUpperCase()
    if (role === 'GUARD') {
      throw { message: 'Guards must register using an organizer invite link.', status: 422 }
    }
    const user = {
      ...MOCK_USERS.organizer,
      email: body.email ?? 'new@gateflow.ai',
      full_name: body.full_name ?? 'New User',
      role: ['ORGANIZER', 'RESIDENT', 'RESIDENTIAL_GUARD'].includes(role) ? role : 'ORGANIZER',
    }
    return ok({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'bearer',
      role: user.role,
      user,
    })
  }

  if (url.includes('/auth/logout') && method === 'post') {
    return ok({ message: 'Logged out successfully' })
  }

  if (url.includes('/auth/refresh') && method === 'post') {
    return ok({
      access_token: 'mock-access-token-refreshed',
      refresh_token: 'mock-refresh-token-new',
      token_type: 'bearer',
      role: 'ORGANIZER',
      user: MOCK_USERS.organizer,
    })
  }

  if (url.includes('/auth/me') && method === 'get') {
    return ok(MOCK_USERS.organizer)
  }

  if (url.includes('/auth/guard-invite/preview') && method === 'get') {
    const token = config.params?.token ?? ''
    if (!token || token.length < 10) throw { message: 'Invalid token', status: 400 }
    const space = _spaces[0] ?? { id: 'sp-001', name: 'Demo space' }
    return ok({
      space_id: String(space.id),
      space_name: space.name ?? 'Space',
      email: 'newguard@example.com',
    })
  }

  if (url.includes('/auth/register-guard') && method === 'post') {
    const body = parseBody(config.data)
    const user = {
      ...MOCK_USERS.guard,
      email: body.email ?? MOCK_USERS.guard.email,
      full_name: body.full_name ?? 'New Guard',
    }
    return ok({
      access_token: 'mock-access-guard-token',
      refresh_token: 'mock-refresh-guard-token',
      token_type: 'bearer',
      role: 'GUARD',
      user,
    })
  }

  // ── Spaces ────────────────────────────────────────────────────────────────
  if (url.match(/\/spaces\/[^/]+$/) && method === 'get') {
    const id = url.split('/').pop()
    const space = _spaces.find((s) => s.id === id)
    if (!space) throw { message: 'Space not found', status: 404 }
    return ok(space)
  }

  if (url.endsWith('/spaces') && method === 'get') {
    return ok({ total: _spaces.length, spaces: _spaces })
  }

  if (url.endsWith('/spaces') && method === 'post') {
    const body = parseBody(config.data)
    const newSpace = {
      ...body,
      id: `sp-${Date.now()}`,
      owner_id: 'usr-org-001',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: null,
    }
    _spaces = [newSpace, ..._spaces]
    return ok(newSpace)
  }

  if (url.match(/\/spaces\/[^/]+$/) && method === 'put') {
    const id = url.split('/').pop()
    const body = parseBody(config.data)
    _spaces = _spaces.map((s) =>
      s.id === id ? { ...s, ...body, updated_at: new Date().toISOString() } : s,
    )
    return ok(_spaces.find((s) => s.id === id))
  }

  if (url.match(/\/spaces\/[^/]+$/) && method === 'delete') {
    const id = url.split('/').pop()
    _spaces = _spaces.filter((s) => s.id !== id)
    delete _guardsBySpace[id]
    return ok(null)
  }

  const guardInvite = url.match(/\/spaces\/([^/]+)\/guards\/invite\/?$/)
  if (guardInvite && method === 'post') {
    const spaceId = guardInvite[1]
    const sp = _spaces.find((s) => s.id === spaceId)
    if (sp && sp.type === 'APARTMENT') {
      throw {
        message: 'Guard invite links are only for events. For apartments, add staff who registered as apartment security.',
        status: 400,
      }
    }
    const body = parseBody(config.data)
    const email = (body.email ?? 'guard@example.com').toString().toLowerCase().trim()
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
    const token = `mock_guard_invite_${spaceId}_${Date.now()}`
    return ok({
      invite_link: `${origin}/register-guard?token=${encodeURIComponent(token)}`,
      email,
      space_id: spaceId,
    })
  }

  const guardCollection = url.match(/\/spaces\/([^/]+)\/guards\/?$/)
  if (guardCollection && method === 'get') {
    const spaceId = guardCollection[1]
    return ok({ guards: _guardsBySpace[spaceId] ?? [] })
  }

  if (guardCollection && method === 'post') {
    const spaceId = guardCollection[1]
    const body = parseBody(config.data)
    const email = (body.email ?? '').toString().toLowerCase().trim()
    if (!email) throw { message: 'Email required', status: 400 }
    const row = {
      id: `usr-g-${Date.now()}`,
      email,
      full_name: email.split('@')[0],
    }
    const list = [...(_guardsBySpace[spaceId] ?? [])]
    if (!list.some((g) => g.email === email)) list.push(row)
    _guardsBySpace[spaceId] = list
    return ok(null, 204)
  }

  const guardOne = url.match(/\/spaces\/([^/]+)\/guards\/([^/]+)\/?$/)
  if (guardOne && method === 'delete') {
    const [, spaceId, guardUserId] = guardOne
    const list = [...(_guardsBySpace[spaceId] ?? [])]
    _guardsBySpace[spaceId] = list.filter((g) => g.id !== guardUserId)
    return ok(null, 204)
  }

  // ── Invites ───────────────────────────────────────────────────────────────
  if (url.endsWith('/invites') && method === 'get') {
    const params = config.params ?? {}
    let result = [..._invites]
    if (params.space_id) result = result.filter((i) => i.space_id === params.space_id)
    if (params.status) result = result.filter((i) => i.status === params.status)
    return ok({ total: result.length, invites: result })
  }

  if (url.endsWith('/invites') && method === 'post') {
    const body = parseBody(config.data)
    const token = `tok_${Math.random().toString(36).substr(2, 9)}`
    const qr_token = `QR-${Date.now()}`
    const newInvite = {
      ...body,
      id: `inv-${Date.now()}`,
      created_by: 'usr-org-001',
      invite_link: `http://localhost:5173/invite/${token}`,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: null,
    }
    _invites = [newInvite, ..._invites]
    return ok({
      invite_id: newInvite.id,
      invite_link: newInvite.invite_link,
      qr_token,
      visitor_name: body.visitor_name ?? 'Visitor',
      space_id: body.space_id,
      invite_type: body.invite_type ?? 'EVENT_GUEST',
      valid_from: body.valid_from,
      valid_until: body.valid_until,
      status: 'ACTIVE',
    })
  }

  if (url.match(/\/invites\/[^/]+$/) && method === 'delete') {
    const id = url.split('/').pop()
    _invites = _invites.map((i) => i.id === id ? { ...i, status: 'REVOKED' } : i)
    return ok(null)
  }

  // ── Visitor (public) ──────────────────────────────────────────────────────
  if (url.includes('/visitor/invite/') && method === 'get') {
    return ok(MOCK_INVITE_OPEN)
  }

  if (url.includes('/visitor/qr/') && method === 'get') {
    return ok({
      qr_token: 'QR-MOCK-001',
      valid_from: MOCK_INVITE_OPEN.valid_from,
      valid_until: MOCK_INVITE_OPEN.valid_until,
      status: 'ACTIVE',
    })
  }

  if (url.includes('/visitor/details/') && method === 'get') {
    return ok({
      invite_id: MOCK_INVITE_OPEN.invite_id,
      visitor_name: MOCK_INVITE_OPEN.visitor_name,
      visitor_email: 'sneha@example.com',
      invite_type: MOCK_INVITE_OPEN.invite_type,
      status: MOCK_INVITE_OPEN.status,
      valid_from: MOCK_INVITE_OPEN.valid_from,
      valid_until: MOCK_INVITE_OPEN.valid_until,
      space: MOCK_INVITE_OPEN.space,
    })
  }

  // ── Entry ─────────────────────────────────────────────────────────────────
  if (url.includes('/entry/scan') && method === 'post') {
    const body = parseBody(config.data)
    if (String(body.qr_token ?? '').toLowerCase().includes('invalid')) {
      throw { message: 'Invalid QR token — entry denied', status: 400 }
    }
    return ok({ ...MOCK_ENTRY_SCAN, gate_id: body.gate_id ?? 'Gate 1' })
  }

  if (url.includes('/entry/active') && method === 'get') {
    return ok({
      space_id: config.params?.space_id ?? 'sp-001',
      total: _visitors.length,
      visitors: _visitors,
    })
  }

  // ── Exit ──────────────────────────────────────────────────────────────────
  if (url.includes('/exit/scan') && method === 'post') {
    const body = parseBody(config.data)
    if (String(body.qr_token ?? '').toLowerCase().includes('invalid')) {
      throw { message: 'Visitor not found inside', status: 400 }
    }
    return ok(MOCK_EXIT_SCAN)
  }

  if (url.includes('/exit/occupancy') && method === 'get') {
    return ok({
      space_id: config.params?.space_id ?? 'sp-001',
      inside: 2,
      exited: 8,
      total_scanned: 10,
    })
  }

  // ── Walk-ins ──────────────────────────────────────────────────────────────
  if (url.includes('/walkins/request') && method === 'post') {
    // config.data is FormData here — parseBody handles it safely
    const body = parseBody(config.data)
    const newWalkin = {
      id: `wk-${Date.now()}`,
      space_id: body.space_id ?? 'sp-001',
      requested_by: 'usr-grd-001',
      visitor_name: body.visitor_name ?? 'Walk-in Visitor',
      visitor_phone: body.visitor_phone ?? null,
      reason: body.reason ?? null,
      proof_image: null,
      status: 'PENDING',
      rejected_note: null,
      invite_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    _walkins = [newWalkin, ..._walkins]
    return ok(newWalkin)
  }

  if (url.includes('/walkins/approve/') && method === 'post') {
    const id = url.split('/').pop()
    const qr_token = `TEMP-QR-${Date.now()}`
    const inviteId = `inv-walkin-${Date.now()}`
    _walkins = _walkins.map((w) =>
      w.id === id ? { ...w, status: 'APPROVED', invite_id: inviteId } : w,
    )
    const walkin = _walkins.find((w) => w.id === id)
    return ok({
      walkin_id: id,
      status: 'APPROVED',
      invite_id: inviteId,
      invite_link: `http://localhost:5173/invite/tok_walkin_${Date.now()}`,
      qr_token,
      visitor_name: walkin?.visitor_name ?? 'Visitor',
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 4 * 3600000).toISOString(),
    })
  }

  if (url.includes('/walkins/reject/') && method === 'post') {
    const id = url.split('/').pop()
    const body = parseBody(config.data)
    _walkins = _walkins.map((w) =>
      w.id === id ? { ...w, status: 'REJECTED', rejected_note: body.note ?? null } : w,
    )
    return ok(_walkins.find((w) => w.id === id))
  }

  if (url.includes('/walkins/pending') && method === 'get') {
    const pending = _walkins.filter((w) => w.status === 'PENDING')
    return ok({ total: pending.length, requests: pending })
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  if (url.includes('/dashboard/stats') && method === 'get') {
    return ok(MOCK_STATS)
  }

  if (url.includes('/dashboard/occupancy') && method === 'get') {
    return ok({ space_id: 'sp-001', inside: 2, exited: 8, total_scanned: 10 })
  }

  if (url.includes('/dashboard/entries') && method === 'get') {
    return ok({
      space_id: 'sp-001',
      total: _visitors.length,
      entries: _visitors.map((v) => ({
        session_id: v.session_id,
        visitor_name: v.visitor_name,
        gate_id: v.gate_id,
        entry_time: v.entry_time,
        exit_time: null,
        allowed_until: v.allowed_until,
        status: v.status,
      })),
    })
  }

  if (url.includes('/dashboard/analytics') && method === 'get') {
    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: `${String(h).padStart(2, '0')}:00`, entries: h % 5 }))
    return ok({
      space_id: config.params?.space_id ?? 'sp-001',
      attendance_by_hour: hours,
      walkin_by_reason: [
        { name: 'Delivery', count: 12 },
        { name: 'Other', count: 8 },
      ],
      weekly_approvals: [
        { name: 'Mon', approved: 2, rejected: 0 },
        { name: 'Tue', approved: 3, rejected: 1 },
        { name: 'Wed', approved: 1, rejected: 0 },
        { name: 'Thu', approved: 4, rejected: 0 },
        { name: 'Fri', approved: 2, rejected: 1 },
        { name: 'Sat', approved: 1, rejected: 0 },
        { name: 'Sun', approved: 0, rejected: 0 },
      ],
      gate_activity: [
        { gate: 'Gate 1', entries: 40, walkins: 5 },
        { gate: 'Gate 2', entries: 22, walkins: 2 },
      ],
      total_entries_24h: 62,
      peak_hour_label: '14:00 UTC',
      approval_rate_percent: 85.5,
      security_alerts_7d: 1,
    })
  }

  if (url.includes('/dashboard/walkins') && method === 'get') {
    return ok({
      space_id: 'sp-001',
      total: _walkins.length,
      requests: _walkins.map((w) => ({
        id: w.id,
        visitor_name: w.visitor_name,
        status: w.status,
        created_at: w.created_at,
      })),
    })
  }

  if (url.includes('/dashboard/overstays') && method === 'get') {
    return ok({ space_id: 'sp-001', total: MOCK_OVERSTAYS.length, sessions: MOCK_OVERSTAYS })
  }

  // ── Overstays ─────────────────────────────────────────────────────────────
  if (url.includes('/overstay/active') && method === 'get') {
    return ok({ space_id: 'sp-001', total: MOCK_OVERSTAYS.length, sessions: MOCK_OVERSTAYS })
  }

  if (url.includes('/overstay/resolve/') && method === 'post') {
    const id = url.split('/').pop()
    return ok({
      session_id: id,
      visitor_name: 'Vikram Singh',
      entry_time: MOCK_OVERSTAYS[0]?.entry_time,
      allowed_until: MOCK_OVERSTAYS[0]?.allowed_until,
    })
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  const path = (url || '').split('?')[0]
  const isNotifListGet = method === 'get' && /\/notifications\/?$/.test(path)
  if (isNotifListGet) {
    const unread = _notifications.filter((n) => !n.is_read).length
    return ok({ total: _notifications.length, unread, notifications: _notifications })
  }

  if (url.includes('/notifications/read-all') && method === 'post') {
    _notifications = _notifications.map((n) => ({ ...n, is_read: true }))
    const unread = 0
    return ok({ total: _notifications.length, unread, notifications: _notifications })
  }

  if (url.includes('/read') && method === 'patch') {
    const id = url.split('/').slice(-2)[0]
    _notifications = _notifications.map((n) =>
      n.id === id ? { ...n, is_read: true } : n,
    )
    return ok(_notifications.find((n) => n.id === id))
  }

  // ── Documents ─────────────────────────────────────────────────────────────
  if (url.includes('/documents/') && method === 'get' && !url.includes('upload')) {
    return ok({
      space_id: config.params?.space_id ?? 'sp-001',
      total: _documents.length,
      documents: _documents,
    })
  }

  if (url.includes('/documents/upload') && method === 'post') {
    // config.data is FormData — extract filename from the File object if present
    let filename = 'Uploaded Document.pdf'
    if (config.data instanceof FormData) {
      const file = config.data.get('file')
      if (file instanceof File) filename = file.name
    }
    const newDoc = {
      id: `doc-${Date.now()}`,
      space_id: config.params?.space_id ?? 'sp-001',
      uploaded_by: 'usr-org-001',
      filename,
      file_path: `uploads/${filename}`,
      file_size: 1024000,
      created_at: new Date().toISOString(),
    }
    _documents = [newDoc, ..._documents]
    return ok(newDoc)
  }

  if (url.match(/\/documents\/[^/]+$/) && method === 'delete') {
    const id = url.split('/').pop()
    _documents = _documents.filter((d) => d.id !== id)
    return ok(null)
  }

  // No mock matched — let it fall through to real network
  return null
}

// ── RAG mock handler ──────────────────────────────────────────────────────────

export async function handleMockRAGRequest(config) {
  const url = config.url ?? ''
  const method = config.method?.toLowerCase()

  await delay(800 + Math.random() * 600)

  if (url === '/' && method === 'get') {
    return ok({ status: 'ok', service: 'GateFlow AI (mock)', version: '2.0.0' })
  }

  if (url.includes('/ask/') && method === 'get') {
    const q = (config.params?.q ?? '').toLowerCase()
    let resp = { ...MOCK_RAG_RESPONSES.default }
    if (q.includes('park')) resp = { ...MOCK_RAG_RESPONSES.parking }
    else if (q.includes('wifi') || q.includes('internet')) resp = { ...MOCK_RAG_RESPONSES.wifi }
    else if (q.includes('start') || q.includes('time') || q.includes('schedule')) {
      resp = { ...MOCK_RAG_RESPONSES.schedule }
    }
    const eventId = url.split('/ask/')[1]?.split('?')[0] ?? 'sp-001'
    return ok({ ...resp, question: config.params?.q ?? '', event_id: eventId })
  }

  if (url.includes('/ingest/') && method === 'post') {
    const eventId = url.split('/ingest/')[1]?.split('?')[0] ?? 'sp-001'
    return ok({
      status: 'success',
      event_id: eventId,
      sentences: 142,
      characters: 8420,
      message: 'Ingested 142 sentences. Cleared 0 stale cache entries.',
    })
  }

  if (url.includes('/events') && method === 'get') {
    return ok({ events: ['sp-001', 'sp-003'], count: 2 })
  }

  if (url.includes('/cache/') && url.includes('/stats') && method === 'get') {
    const eventId = url.split('/cache/')[1]?.split('/')[0] ?? 'sp-001'
    return ok({ event_id: eventId, total: 12, hits_today: 34 })
  }

  if (url.includes('/cache/') && method === 'delete') {
    const eventId = url.split('/cache/')[1]?.split('?')[0] ?? 'sp-001'
    return ok({ status: 'cache cleared', event_id: eventId, deleted: 12 })
  }

  return null
}
