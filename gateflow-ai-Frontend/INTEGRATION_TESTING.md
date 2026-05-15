# GateFlow Frontend - Integration Testing Guide

**Phase 5: Integration & Validation**

This guide provides comprehensive testing scenarios for the redesigned GateFlow frontend to ensure all backend integrations, WebSocket connections, and UX improvements are functioning correctly.

---

## 1. Environment Setup

### Development with Mock Mode

```bash
# .env.development or .env file
VITE_MOCK_MODE=true
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_RAG_BASE_URL=http://localhost:8001
VITE_APP_ENV=development
```

### Production with Real Backend

```bash
# .env.production
VITE_MOCK_MODE=false
VITE_API_BASE_URL=https://api.gateflow.ai
VITE_WS_BASE_URL=wss://api.gateflow.ai
VITE_RAG_BASE_URL=https://rag.gateflow.ai
VITE_APP_ENV=production
```

---

## 2. Authentication Flow Testing

### 2.1 Login & Token Refresh

**Test Scenario**: User logs in and tokens are properly managed

```
Steps:
1. Navigate to /login
2. Enter credentials (organizer@gateflow.ai / demo1234)
3. Verify success redirect to /dashboard
4. Check browser Storage → auth store has tokens
5. Refresh page → tokens persist (no re-login needed)
6. Wait 5+ minutes (token expiry) → new API call made
7. Verify token refresh automatically triggered
8. Original request retried with new token
```

**Expected Results**:
- ✅ `authStore` has `token`, `refreshToken`, `user`
- ✅ Authorization header includes `Bearer <token>`
- ✅ On 401: Token refresh auto-triggered, request retried
- ✅ On refresh failure: Redirect to /login, store cleared

**Files to verify**:
- [src/services/http/axiosInstance.js](src/services/http/axiosInstance.js) - Token refresh logic
- [src/store/authStore.js](src/store/authStore.js) - Token storage

### 2.2 Session Persistence

**Test Scenario**: User session persists across browser reloads

```
Steps:
1. Login successfully
2. Copy tokens from browser Storage → localStorage
3. Reload page (Cmd+R / Ctrl+R)
4. Verify user still logged in
5. Verify tokens still present in store
6. Make API call → verify Authorization header present
```

**Expected Results**:
- ✅ User remains logged in after page reload
- ✅ Tokens hydrated from storage
- ✅ Dashboard loads without re-login

### 2.3 Logout Flow

**Test Scenario**: User logs out and session is cleared

```
Steps:
1. Login successfully
2. Click logout button (or navigate to auth controller)
3. Verify tokens are cleared from storage
4. Verify redirect to /login
5. Try accessing /dashboard → redirected to /login
```

**Expected Results**:
- ✅ Tokens cleared from authStore
- ✅ Redirect to /login or auth page
- ✅ Protected routes require login

---

## 3. API Endpoint Integration Testing

### 3.1 Dashboard Stats Endpoint

**Endpoint**: `GET /dashboard/stats?space_id=<id>`

**Test Scenario**:

```
Steps:
1. Login as organizer
2. Navigate to /dashboard
3. Select a space
4. Observe MetricCard values (inside, exited, overstayed, pending)
5. Open Network tab → inspect GET /dashboard/stats request
6. Verify response includes: { inside, exited, overstayed, pending_walkins, total_entries }
7. MetricCards display correct values
```

**Expected Results**:
- ✅ Request includes `space_id` parameter
- ✅ Authorization header present
- ✅ Response status 200
- ✅ MetricCards render values correctly
- ✅ No console errors

**Mock Mode Check**:
- ✅ [src/mock/mockHandlers.js](src/mock/mockHandlers.js) returns realistic stats

### 3.2 Recent Entries Endpoint

**Endpoint**: `GET /dashboard/entries?space_id=<id>&limit=20`

**Test Scenario**:

```
Steps:
1. Navigate to /dashboard
2. Scroll to "Recent Entries" section
3. Observe list of recent visitor entries
4. Open Network tab → inspect GET /dashboard/entries request
5. Verify limit parameter (20) is sent
6. Check response includes: [ { visitor_name, entry_time, status, gate_id }, ... ]
7. Verify SkeletonTable loads before data appears
```

**Expected Results**:
- ✅ Limit parameter correctly set
- ✅ Entries display with correct format
- ✅ StatusBadge shows correct status (inside/exited/overstayed)
- ✅ Loading skeleton shows during fetch
- ✅ No duplicate entries

### 3.3 Walk-in Approval Endpoint

**Endpoint**: `POST /walkins/<id>/approve`, `POST /walkins/<id>/reject`

**Test Scenario**:

```
Steps:
1. Login as organizer
2. Navigate to /walkins (Walk-in Approvals page)
3. Observe pending walk-ins list
4. Click approve on a walk-in
5. Open Network tab → inspect POST request
6. Verify request includes necessary data
7. Verify success response (201/200)
8. Walk-in disappears from list with animation
9. Toast notification appears "✓ Walk-in approved"
```

**Expected Results**:
- ✅ POST /walkins/<id>/approve succeeds
- ✅ Walk-in removed from UI
- ✅ Toast notification displays
- ✅ No page reload needed
- ✅ Undo/retry possible (if backend supports)

### 3.4 Entry Scan Endpoint

**Endpoint**: `POST /entries/scan`

**Test Scenario**:

```
Steps:
1. Login as guard
2. Navigate to /guard/entry
3. Click "Scan Entry" button
4. QR scanner opens
5. Scan a valid QR code (or use mock data)
6. Open Network tab → inspect POST /entries/scan
7. Verify response: { session_id, visitor_name, gate_id, entry_time, status }
8. Green checkmark appears on screen
9. Result auto-clears after 3 seconds
10. UI ready for next scan
```

**Expected Results**:
- ✅ POST includes QR token/data in request
- ✅ Authorization header present
- ✅ Response 201 (created)
- ✅ Green checkmark + visitor name displayed
- ✅ Auto-clear after 3 seconds
- ✅ No errors in console

### 3.5 Exit Scan Endpoint

**Endpoint**: `POST /entries/<session_id>/exit`

**Test Scenario**:

```
Steps:
1. Navigate to /guard/exit
2. Click "Scan Exit" button
3. Scan QR code
4. Open Network tab → inspect POST request
5. Verify session_id in URL
6. Response includes: { session_id, exit_time, duration }
7. Red checkmark appears
8. Auto-clear after 3 seconds
```

**Expected Results**:
- ✅ POST to correct endpoint with session_id
- ✅ Response 200
- ✅ Red checkmark displayed
- ✅ Auto-clear works

---

## 4. WebSocket Real-Time Updates Testing

### 4.1 Connection Establishment

**Test Scenario**: WebSocket connects on dashboard page

```
Steps:
1. Login and navigate to /dashboard
2. Open DevTools → Network tab → WS filter
3. Observe WebSocket connection to ws://localhost:8000/ws/dashboard/<space_id>
4. Verify status: "101 Web Socket Protocol Handshake"
5. Connection indicator shows "Live" (green Wifi icon)
6. Close DevTools and reopen → connection still active
```

**Expected Results**:
- ✅ WS connection established
- ✅ URL includes correct space_id
- ✅ "Live" indicator shown (green Wifi icon in subtitle)
- ✅ Connection persists

**Files to verify**:
- [src/services/websocketService.js](src/services/websocketService.js) - WebSocket client
- [src/hooks/useDashboardWS.js](src/hooks/useDashboardWS.js) - Hook integration

### 4.2 Real-Time Entry Event

**Test Scenario**: When a visitor enters, metric card updates in real-time

```
Steps:
1. Dashboard open in browser
2. In another terminal/device: Trigger entry event (POST /entries/scan)
3. Observe in Browser:
   - WS message appears in DevTools → Frame tab (if enabled)
   - MetricCard "Inside" value increments by 1
   - No page reload or manual refresh needed
4. Check DevTools WS frame data: { event: "ENTRY", visitor_name, session_id, gate_id }
5. Repeat with 3-5 entries → verify all update in real-time
```

**Expected Results**:
- ✅ MetricCard updates within 1-2 seconds of scan
- ✅ WS message received and parsed
- ✅ No console errors
- ✅ Multiple events processed correctly

### 4.3 Auto-Reconnect on Disconnect

**Test Scenario**: WebSocket auto-reconnects after network interruption

```
Steps:
1. Dashboard open, connection established (Live indicator shows)
2. Open DevTools → Network tab → throttle to "Offline"
3. Wait 2-3 seconds
4. Connection indicator changes to "Polling" (orange icon)
5. Change throttle back to "Online"
6. Wait 5-10 seconds
7. Connection indicator returns to "Live"
8. Make entry/exit scan → metrics update in real-time
```

**Expected Results**:
- ✅ Polling mode activates when offline
- ✅ Auto-reconnect happens within 30 seconds
- ✅ Live indicator returns to green
- ✅ Metrics update resumes
- ✅ No manual refresh needed

### 4.4 Error Handling & Graceful Degradation

**Test Scenario**: WebSocket error doesn't break the app

```
Steps:
1. Connect successfully → "Live" indicator shown
2. Close WebSocket connection (DevTools → Right-click frame → Block)
3. Observe "Polling" indicator appears
4. MetricCards still update (via polling, slower)
5. No error banners shown to user
6. App remains fully functional
```

**Expected Results**:
- ✅ Graceful fallback to polling
- ✅ No critical error messages
- ✅ Metrics still update (polling every 30s)
- ✅ User can continue working

---

## 5. Mock Mode Functionality Testing

### 5.1 Mock Auth

**Test Scenario**: Login with mock accounts

```bash
# Valid mock credentials (when VITE_MOCK_MODE=true)
organizer@gateflow.ai / demo1234
resident@gateflow.ai / demo1234
guard@gateflow.ai / demo1234
admin@gateflow.ai / demo1234
```

**Expected Results**:
- ✅ All accounts login successfully
- ✅ Correct role assigned (ORGANIZER, RESIDENT, GUARD, ADMIN)
- ✅ Different dashboards for each role
- ✅ Invalid credentials rejected

### 5.2 Mock Data Persistence

**Test Scenario**: Mock mutations persist during session

```
Steps:
1. Enable VITE_MOCK_MODE=true
2. Create an invite
3. Verify it appears in invite list
4. Reload page (Cmd+R)
5. Invite still appears (in-memory state persisted)
6. Approve a walk-in
7. Reload page
8. Walk-in remains approved
9. Close tab and reopen
10. Walk-in data is cleared (new session)
```

**Expected Results**:
- ✅ Mutations persist within session
- ✅ Page reload preserves mock data
- ✅ New session clears mock data
- ✅ No backend calls made

### 5.3 Mock Endpoints Coverage

**Test Scenario**: All critical endpoints have mock handlers

```
Verify these endpoints return mock data:
- POST /auth/login ✅
- POST /auth/register ✅
- GET /dashboard/stats ✅
- GET /dashboard/entries ✅
- POST /entries/scan ✅
- POST /entries/<id>/exit ✅
- POST /walkins/<id>/approve ✅
- POST /invites ✅
- GET /spaces ✅
- GET /notifications ✅
```

**Files to verify**:
- [src/mock/mockHandlers.js](src/mock/mockHandlers.js) - All endpoint handlers
- [src/mock/mockData.js](src/mock/mockData.js) - Mock data definitions

---

## 6. Mobile Responsiveness Testing

### 6.1 Touch Targets & Tap Areas

**Test Scenario**: All interactive elements have ≥48px touch targets

**Devices to test**:
- iPhone 12/13 (5.4", 390px width)
- iPhone Pro Max (6.7", 428px width)
- Android Pixel 6 (6.1", 412px width)
- Tablet iPad (9.7", 768px width)

```
Steps:
1. Open /guard/entry on mobile device
2. Tap "Scan Entry" button → responsive and easy to tap
3. Tap "Approve" on walk-in card → responsive
4. Tap MetricCard → no layout shift
5. Scroll → smooth, no jank
6. Long press → no context menu interference
```

**Expected Results**:
- ✅ All buttons ≥48×48px
- ✅ No layout shifts on tap
- ✅ Smooth scrolling (60fps if possible)
- ✅ No tap delays (mobile fast-click detection)

### 6.2 Responsive Layouts

**Test Scenario**: Layouts adapt to screen size

```
Steps:
1. Open /dashboard on mobile (width 375px)
   - Sidebar hidden
   - MetricCards stack vertically (1 column)
   - Action buttons full-width
2. Resize to tablet (768px)
   - Sidebar visible or collapsible
   - MetricCards 2-column grid
   - Content comfortable spacing
3. Resize to desktop (1440px)
   - Full sidebar
   - MetricCards 4-column grid
   - Multiple columns for content
```

**Expected Results**:
- ✅ Mobile: 1-column layout, large text, stacked cards
- ✅ Tablet: 2-column grid, sidebar optional
- ✅ Desktop: 3-4 column grid, full layout
- ✅ No horizontal scroll on mobile
- ✅ No text truncation at breakpoints

### 6.3 Slow Network Testing

**Test Scenario**: App performs well on slow networks

```
Steps:
1. Open DevTools → Network → Throttle to "Slow 3G"
2. Navigate to /dashboard
3. Observe SkeletonTable loading state for 3-5 seconds
4. Metrics appear with skeleton animation
5. User can still tap buttons while loading
6. No timeout errors (verify axios timeout setting)
7. Throttle to "Fast 3G"
8. Content loads quickly (1-2 seconds)
```

**Expected Results**:
- ✅ Loading skeletons shown immediately
- ✅ UI responsive even while loading
- ✅ No network timeouts
- ✅ Content loads within 15 seconds (axios timeout)
- ✅ Error message shown if timeout occurs

---

## 7. Error Handling & Edge Cases

### 7.1 Network Error Handling

**Test Scenario**: App handles network errors gracefully

```
Steps:
1. Open DevTools → Network → Block specific domain
2. Try to load /dashboard → observe error handling
3. Verify: Error message shown OR fallback UI shown
4. User can retry without page reload
5. Fix network block
6. Retry works → data loads
```

**Expected Results**:
- ✅ Error message shown (not blank page)
- ✅ Retry button available
- ✅ No console errors
- ✅ App remains responsive

### 7.2 401 Unauthorized Handling

**Test Scenario**: Invalid or expired token triggers re-auth

```
Steps:
1. Login successfully
2. Manually delete access token from localStorage
3. Try to load /dashboard
4. Verify: Redirect to /login OR error message
5. Login again → dashboard loads
```

**Expected Results**:
- ✅ Automatic logout on 401
- ✅ Redirect to /login
- ✅ No infinite redirect loop
- ✅ Clear error messaging

### 7.3 Empty State Handling

**Test Scenario**: Empty states render correctly

```
Steps:
1. Create new organizer account (no spaces)
2. Navigate to /dashboard
3. Verify: EmptyState shown with "Create Space" button
4. Click button → navigate to /spaces
5. Create a space
6. Navigate back to /dashboard
7. Dashboard loads with the new space
```

**Expected Results**:
- ✅ EmptyState component displays
- ✅ Action button navigates correctly
- ✅ No crash or error page
- ✅ User journey clear

---

## 8. Accessibility Testing

### 8.1 Screen Reader Testing

**Test Scenario**: Screen reader users can navigate the app

```
Tools: VoiceOver (Mac), NVDA (Windows), JAWS (Windows)

Steps:
1. Enable VoiceOver/NVDA
2. Tab through /dashboard
3. Verify all interactive elements are announced:
   - "Approve button, inside metric card"
   - "Scan entry button, large action"
   - "Loading spinner, busy"
4. Navigate with arrow keys → all elements reachable
5. Press Enter on buttons → actions work
6. Verify form labels associated with inputs
```

**Expected Results**:
- ✅ All buttons announced with aria-label
- ✅ Icons announced (not generic "image")
- ✅ Loading states announced (aria-busy)
- ✅ Status changes announced (role="status")
- ✅ Tab order logical

### 8.2 Keyboard Navigation

**Test Scenario**: All functionality accessible via keyboard

```
Steps:
1. Disable mouse
2. Use Tab to navigate
3. Use Shift+Tab to go backwards
4. Use Enter/Space to activate buttons
5. Verify all pages navigable
6. Verify all actions doable
```

**Expected Results**:
- ✅ Every button/input reachable
- ✅ No keyboard traps
- ✅ Focus indicator visible (outline)
- ✅ Logical tab order

### 8.3 Color Contrast

**Test Scenario**: Text meets WCAG AAA contrast standards

```
Tools: WebAIM contrast checker, Axe DevTools

Steps:
1. Install Axe DevTools extension
2. Open various pages
3. Run accessibility audit
4. Verify no contrast warnings
5. Check text on all backgrounds:
   - Buttons on primary blue
   - Text on cards
   - Badges on colored backgrounds
```

**Expected Results**:
- ✅ All text 7:1 contrast ratio (AAA)
- ✅ No contrast violations
- ✅ Text readable in all themes

---

## 9. Backend Integration Checklist

### Required Endpoints

- [ ] `POST /auth/login` - User authentication
- [ ] `POST /auth/register` - User registration
- [ ] `POST /auth/refresh` - Token refresh
- [ ] `GET /dashboard/stats` - Overall statistics
- [ ] `GET /dashboard/entries` - Recent entries
- [ ] `GET /dashboard/occupancy` - Inside/exited counts
- [ ] `GET /dashboard/walkins` - Pending walk-ins
- [ ] `GET /dashboard/overstays` - Overstayed visitors
- [ ] `POST /entries/scan` - Scan entry QR
- [ ] `POST /entries/<id>/exit` - Scan exit QR
- [ ] `GET /spaces` - User's spaces
- [ ] `POST /spaces` - Create space
- [ ] `POST /invites` - Create invite
- [ ] `GET /invites` - List invites
- [ ] `POST /walkins/<id>/approve` - Approve walk-in
- [ ] `POST /walkins/<id>/reject` - Reject walk-in
- [ ] `GET /notifications` - User notifications
- [ ] `WS /ws/dashboard/{space_id}` - Real-time updates

### WebSocket Event Types

- [ ] `ENTRY` - New visitor entered
- [ ] `EXIT` - Visitor exited
- [ ] `WALKIN` - New walk-in request

---

## 10. Performance Testing

### 10.1 Metrics Loading

```
Steps:
1. Open DevTools → Performance tab
2. Navigate to /dashboard
3. Record performance
4. Metrics displayed within 3 seconds
5. Check:
   - First Contentful Paint (FCP): < 2s
   - Largest Contentful Paint (LCP): < 3s
   - Cumulative Layout Shift (CLS): < 0.1
```

**Expected Results**:
- ✅ All Core Web Vitals pass
- ✅ SkeletonCards show immediately
- ✅ No jank on metric updates

### 10.2 Real-Time Updates Performance

```
Steps:
1. Dashboard open with Network throttle to "Fast 3G"
2. Trigger 5 entry scans rapidly
3. Observe metric updates
4. Verify: No lag, no duplicate updates
5. Check console for errors
```

**Expected Results**:
- ✅ All 5 updates processed
- ✅ Metrics accurate
- ✅ No console errors
- ✅ Animations smooth

---

## 11. Test Execution Plan

### Phase 5A: Quick Smoke Test (30 mins)

```bash
# Run this before any deployment
1. ✅ Login works
2. ✅ Dashboard loads
3. ✅ MetricCards display
4. ✅ Buttons responsive
5. ✅ No console errors
```

### Phase 5B: Full Integration Test (2-3 hours)

```bash
# Run this for major releases
1. Run all sections 1-8
2. Test each role (Guard, Organizer, Resident, Admin)
3. Test on 2-3 device types
4. Test mock mode + real backend mode
5. Document any issues
```

### Phase 5C: Load & Stress Test (1+ hour)

```bash
# Run this before production deployment
1. Simulate 50+ concurrent users
2. Rapid entry/exit scanning (20+ per second)
3. WebSocket connection stability under load
4. Memory leaks (test for 30+ minutes)
5. Backend API response times
```

---

## 12. Bug Report Template

When issues are found, document them:

```markdown
## Bug Report

**Title**: [Component/Page] - Brief description

**Severity**: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

**Environment**:
- Browser: Chrome 121, Firefox 121, Safari 17
- Device: iPhone 12, MacBook Pro
- Network: WiFi, 3G, Offline
- Mode: Mock / Real Backend

**Steps to Reproduce**:
1. Navigate to /page
2. Click button
3. Observe X behavior
4. Expected Y behavior

**Actual Result**: [Screenshot/video if possible]

**Files Affected**:
- src/pages/...
- src/components/ui/...

**Console Errors**: [Paste error logs]
```

---

## 13. Success Criteria

✅ **All tests passing**:
- Auth flow: 100% success
- API endpoints: 100% responding correctly
- WebSocket: 100% connected and updating
- Mobile: Responsive on all breakpoints
- Accessibility: WCAG AAA compliant
- Performance: Core Web Vitals pass
- Mock mode: All endpoints covered
- Error handling: Graceful degradation

✅ **No critical bugs**:
- No 500 errors
- No infinite loops
- No data loss
- No security issues

✅ **Production ready**:
- All environment variables set
- Error logging configured
- Performance monitoring enabled
- Deployment checklist complete

---

## Next Steps

1. **Pre-Launch**: Run Smoke Test (Section 11A)
2. **UAT**: Run Full Integration Test (Section 11B)
3. **Production Deployment**: Run Load Test (Section 11C)
4. **Post-Launch**: Monitor error logs and performance metrics

