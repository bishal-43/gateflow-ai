/**
 * mockData.js — Realistic mock data matching backend response schemas exactly.
 *
 * All shapes mirror the Pydantic schemas in gateflow-ai-ujwal/gateflow-backend/schemas/.
 * When VITE_MOCK_MODE=false these are never imported — zero bundle impact in production.
 */

import { v4 as uuid } from './uuid'

// ── Users ─────────────────────────────────────────────────────────────────────
export const MOCK_USERS = {
  organizer: {
    id: 'usr-org-001',
    email: 'organizer@gateflow.ai',
    full_name: 'Arjun Kapoor',
    role: 'ORGANIZER',
    auth_provider: 'EMAIL',
    avatar_url: null,
    is_active: true,
    is_verified: true,
  },
  resident: {
    id: 'usr-res-001',
    email: 'resident@gateflow.ai',
    full_name: 'Priya Sharma',
    role: 'RESIDENT',
    auth_provider: 'EMAIL',
    avatar_url: null,
    is_active: true,
    is_verified: true,
  },
  guard: {
    id: 'usr-grd-001',
    email: 'guard@gateflow.ai',
    full_name: 'Ramesh Gupta',
    role: 'GUARD',
    auth_provider: 'EMAIL',
    avatar_url: null,
    is_active: true,
    is_verified: true,
  },
  residential_guard: {
    id: 'usr-rsg-001',
    email: 'resguard@gateflow.ai',
    full_name: 'Anil Verma',
    role: 'RESIDENTIAL_GUARD',
    auth_provider: 'EMAIL',
    avatar_url: null,
    is_active: true,
    is_verified: true,
  },
  admin: {
    id: 'usr-adm-001',
    email: 'admin@gateflow.ai',
    full_name: 'Platform Admin',
    role: 'ADMIN',
    auth_provider: 'EMAIL',
    avatar_url: null,
    is_active: true,
    is_verified: true,
  },
}

// ── Spaces ────────────────────────────────────────────────────────────────────
export const MOCK_SPACES = [
  {
    id: 'sp-001',
    type: 'EVENT',
    name: 'Tech Summit 2026',
    owner_id: 'usr-org-001',
    venue: 'Bangalore International Convention Centre',
    start_time: '2026-05-15T09:00:00+05:30',
    end_time: '2026-05-15T18:00:00+05:30',
    address: 'BICC, Tumkur Road, Bengaluru, Karnataka 560052',
    walkin_enabled: true,
    max_guests: 500,
    is_active: true,
    created_at: '2026-05-01T10:00:00+05:30',
    updated_at: '2026-05-10T08:00:00+05:30',
  },
  {
    id: 'sp-002',
    type: 'EVENT',
    name: 'Product Launch — GateFlow v2',
    owner_id: 'usr-org-001',
    venue: 'The Leela Palace',
    start_time: '2026-05-20T18:00:00+05:30',
    end_time: '2026-05-20T22:00:00+05:30',
    address: '23 Airport Road, Bengaluru, Karnataka 560008',
    walkin_enabled: false,
    max_guests: 200,
    is_active: true,
    created_at: '2026-05-02T10:00:00+05:30',
    updated_at: null,
  },
  {
    id: 'sp-003',
    type: 'APARTMENT',
    name: 'Green Valley Residency',
    owner_id: 'usr-res-001',
    venue: null,
    start_time: null,
    end_time: null,
    address: 'Sector 62, Noida, Uttar Pradesh 201309',
    walkin_enabled: true,
    max_guests: null,
    is_active: true,
    created_at: '2026-04-15T10:00:00+05:30',
    updated_at: null,
  },
]

// ── Invites ───────────────────────────────────────────────────────────────────
export const MOCK_INVITES = [
  {
    id: 'inv-001',
    space_id: 'sp-001',
    created_by: 'usr-org-001',
    visitor_name: 'Sneha Patel',
    visitor_email: 'sneha@example.com',
    visitor_phone: '+91 98765 43210',
    invite_type: 'EVENT_GUEST',
    invite_link: 'http://localhost:5173/invite/tok_abc123xyz',
    status: 'ACTIVE',
    valid_from: '2026-05-15T08:00:00+05:30',
    valid_until: '2026-05-15T20:00:00+05:30',
    created_at: '2026-05-10T10:00:00+05:30',
    updated_at: null,
  },
  {
    id: 'inv-002',
    space_id: 'sp-001',
    created_by: 'usr-org-001',
    visitor_name: 'Vikram Singh',
    visitor_email: 'vikram@example.com',
    visitor_phone: '+91 87654 32109',
    invite_type: 'EVENT_GUEST',
    invite_link: 'http://localhost:5173/invite/tok_def456uvw',
    status: 'USED',
    valid_from: '2026-05-15T08:00:00+05:30',
    valid_until: '2026-05-15T20:00:00+05:30',
    created_at: '2026-05-10T10:05:00+05:30',
    updated_at: null,
  },
  {
    id: 'inv-003',
    space_id: 'sp-003',
    created_by: 'usr-res-001',
    visitor_name: 'Kavita Rao',
    visitor_email: null,
    visitor_phone: '+91 76543 21098',
    invite_type: 'APARTMENT_VISITOR',
    invite_link: 'http://localhost:5173/invite/tok_ghi789rst',
    status: 'ACTIVE',
    valid_from: '2026-05-13T10:00:00+05:30',
    valid_until: '2026-05-13T22:00:00+05:30',
    created_at: '2026-05-12T09:00:00+05:30',
    updated_at: null,
  },
  {
    id: 'inv-004',
    space_id: 'sp-001',
    created_by: 'usr-org-001',
    visitor_name: 'Delivery Agent',
    visitor_email: null,
    visitor_phone: null,
    invite_type: 'VENDOR',
    invite_link: 'http://localhost:5173/invite/tok_jkl012mno',
    status: 'EXPIRED',
    valid_from: '2026-05-12T14:00:00+05:30',
    valid_until: '2026-05-12T16:00:00+05:30',
    created_at: '2026-05-12T13:00:00+05:30',
    updated_at: null,
  },
]

// ── Entry Sessions ────────────────────────────────────────────────────────────
export const MOCK_ACTIVE_VISITORS = [
  {
    session_id: 'sess-001',
    invite_id: 'inv-001',
    visitor_name: 'Sneha Patel',
    gate_id: 'Gate 1',
    entry_time: new Date(Date.now() - 90 * 60000).toISOString(),
    allowed_until: new Date(Date.now() + 6 * 3600000).toISOString(),
    status: 'INSIDE',
  },
  {
    session_id: 'sess-002',
    invite_id: 'inv-002',
    visitor_name: 'Vikram Singh',
    gate_id: 'Gate 2',
    entry_time: new Date(Date.now() - 3 * 3600000).toISOString(),
    allowed_until: new Date(Date.now() - 30 * 60000).toISOString(),
    status: 'OVERSTAYED',
  },
  {
    session_id: 'sess-003',
    invite_id: 'inv-003',
    visitor_name: 'Ananya Reddy',
    gate_id: 'Gate 1',
    entry_time: new Date(Date.now() - 45 * 60000).toISOString(),
    allowed_until: new Date(Date.now() + 4 * 3600000).toISOString(),
    status: 'INSIDE',
  },
]

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export const MOCK_STATS = {
  space_id: 'sp-001',
  inside: 2,
  exited: 8,
  overstayed: 1,
  pending_walkins: 2,
  total_entries: 11,
}

// ── Walk-in Requests ──────────────────────────────────────────────────────────
export const MOCK_WALKINS = [
  {
    id: 'wk-001',
    space_id: 'sp-001',
    requested_by: 'usr-grd-001',
    visitor_name: 'Suresh Kumar',
    visitor_phone: '+91 99887 76655',
    reason: 'Package delivery for Arjun Kapoor',
    proof_image: null,
    status: 'PENDING',
    rejected_note: null,
    invite_id: null,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'wk-002',
    space_id: 'sp-001',
    requested_by: 'usr-grd-001',
    visitor_name: 'Kavita Rao',
    visitor_phone: '+91 88776 65544',
    reason: 'Medical emergency — doctor visit',
    proof_image: null,
    status: 'PENDING',
    rejected_note: null,
    invite_id: null,
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: 'wk-003',
    space_id: 'sp-001',
    requested_by: 'usr-grd-001',
    visitor_name: 'Mohan Das',
    visitor_phone: '+91 77665 54433',
    reason: 'Equipment setup for main stage',
    proof_image: null,
    status: 'APPROVED',
    rejected_note: null,
    invite_id: 'inv-005',
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 40 * 60000).toISOString(),
  },
]

// ── Notifications ─────────────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-001',
    user_id: 'usr-org-001',
    space_id: 'sp-001',
    type: 'WALKIN_REQUEST',
    title: 'New Walk-in Request',
    message: 'Suresh Kumar is requesting entry at Gate 1',
    is_read: false,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'notif-002',
    user_id: 'usr-org-001',
    space_id: 'sp-001',
    type: 'OVERSTAY_ALERT',
    title: 'Overstay Alert',
    message: 'Vikram Singh has exceeded allowed stay duration at Tech Summit 2026',
    is_read: false,
    created_at: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    id: 'notif-003',
    user_id: 'usr-org-001',
    space_id: 'sp-001',
    type: 'WALKIN_REQUEST',
    title: 'Walk-in Approved',
    message: 'Mohan Das has been approved. Temp QR generated.',
    is_read: true,
    created_at: new Date(Date.now() - 40 * 60000).toISOString(),
  },
  {
    id: 'notif-004',
    user_id: 'usr-org-001',
    space_id: 'sp-001',
    type: 'EVENT_REMINDER',
    title: 'Event Starting Soon',
    message: 'Tech Summit 2026 starts in 1 hour',
    is_read: true,
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
  },
]

// ── Documents ─────────────────────────────────────────────────────────────────
export const MOCK_DOCUMENTS = [
  {
    id: 'doc-001',
    space_id: 'sp-001',
    uploaded_by: 'usr-org-001',
    filename: 'Event Schedule.pdf',
    file_path: 'uploads/event-schedule.pdf',
    file_size: 2516582,
    created_at: '2026-05-12T08:00:00+05:30',
  },
  {
    id: 'doc-002',
    space_id: 'sp-001',
    uploaded_by: 'usr-org-001',
    filename: 'Venue Map.pdf',
    file_path: 'uploads/venue-map.pdf',
    file_size: 1887436,
    created_at: '2026-05-12T08:05:00+05:30',
  },
  {
    id: 'doc-003',
    space_id: 'sp-001',
    uploaded_by: 'usr-org-001',
    filename: 'FAQ Document.pdf',
    file_path: 'uploads/faq.pdf',
    file_size: 943718,
    created_at: '2026-05-12T09:30:00+05:30',
  },
]

// ── Overstays ─────────────────────────────────────────────────────────────────
export const MOCK_OVERSTAYS = [
  {
    session_id: 'sess-002',
    visitor_name: 'Vikram Singh',
    entry_time: new Date(Date.now() - 3 * 3600000).toISOString(),
    allowed_until: new Date(Date.now() - 30 * 60000).toISOString(),
  },
]

// ── Visitor session (for /invite/:token) ──────────────────────────────────────
export const MOCK_INVITE_OPEN = {
  invite_id: 'inv-001',
  visitor_name: 'Sneha Patel',
  invite_type: 'EVENT_GUEST',
  status: 'ACTIVE',
  valid_from: '2026-05-15T08:00:00+05:30',
  valid_until: '2026-05-15T20:00:00+05:30',
  space: {
    id: 'sp-001',
    type: 'EVENT',
    name: 'Tech Summit 2026',
    venue: 'Bangalore International Convention Centre',
    address: 'BICC, Tumkur Road, Bengaluru',
    start_time: '2026-05-15T09:00:00+05:30',
    end_time: '2026-05-15T18:00:00+05:30',
  },
  // Minimal base64 1x1 white pixel PNG — real backend returns actual QR
  qr_code_b64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
}

// ── Entry scan result ─────────────────────────────────────────────────────────
export const MOCK_ENTRY_SCAN = {
  status: 'ALLOWED',
  visitor_name: 'Sneha Patel',
  session_id: 'sess-new-001',
  invite_id: 'inv-001',
  space_id: 'sp-001',
  gate_id: 'Gate 1',
  entry_time: new Date().toISOString(),
  allowed_until: new Date(Date.now() + 8 * 3600000).toISOString(),
}

// ── Exit scan result ──────────────────────────────────────────────────────────
export const MOCK_EXIT_SCAN = {
  status: 'EXIT_RECORDED',
  visitor_name: 'Sneha Patel',
  session_id: 'sess-001',
  exit_time: new Date().toISOString(),
}

// ── RAG ask response ──────────────────────────────────────────────────────────
export const MOCK_RAG_RESPONSES = {
  default: {
    question: '',
    answer: 'I can help with questions about the schedule, venue, speakers, parking, WiFi, and more. What would you like to know?',
    event_id: 'sp-001',
    cache_hit: false,
  },
  parking: {
    answer: 'Parking is available at Basement P1 and P2. Show your event pass at the parking entry — it\'s complimentary for all registered attendees.',
    cache_hit: true,
  },
  wifi: {
    answer: 'Free WiFi is available throughout the venue. Network: GateFlow-Event | Password: summit2026',
    cache_hit: false,
  },
  schedule: {
    answer: 'The event starts at 9:00 AM with registration and welcome coffee at the Main Lobby. The opening keynote begins at 10:00 AM in the Main Hall.',
    cache_hit: false,
  },
}
