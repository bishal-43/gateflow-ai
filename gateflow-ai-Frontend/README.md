# GateFlow Frontend - Icon-Driven Access Control Interface

**A modern, illiterate-friendly, responsive React application for managing visitor access, entry/exit scanning, and occupancy tracking.**

🎯 **Mission**: Simplify access control with icon-driven UI, minimal text, and instant visual feedback.

---

## ✨ Features

### 🛡️ Access Control
- **Entry/Exit Scanning** - Large QR code scanner with instant visual feedback (✓ green / ✗ red)
- **Real-Time Occupancy** - Live metric cards updating via WebSocket (inside/exited/overstayed)
- **Overstay Alerts** - Color-coded warnings for guests exceeding time limits
- **Walk-in Management** - Approve/reject visitors with one tap

### 🎨 User Experience
- **Icon-First Design** - Universally recognizable icons + emoji
- **Color Semantics** - Green (allowed), Red (blocked), Amber (pending), Blue (info)
- **Mobile-Optimized** - 48px+ touch targets, responsive layouts
- **Dark Mode** - Full light/dark theme support with CSS variables
- **Accessibility** - ARIA labels, keyboard navigation, WCAG AAA contrast

### 🏗️ Architecture
- **Component-Driven** - Reusable UI library (Button, Card, MetricCard, StatusBadge, etc.)
- **Mock Mode** - Develop without backend (VITE_MOCK_MODE=true)
- **Real-Time Updates** - WebSocket for live dashboard metrics
- **Automatic Token Refresh** - Silent auth token management
- **Graceful Degradation** - Fallback to polling if WebSocket fails

### 📱 Responsive Breakpoints
- **Mobile** (< 768px) - Single column, large buttons, hidden sidebar
- **Tablet** (768px - 1024px) - Two columns, collapsible sidebar
- **Desktop** (> 1024px) - Full layout, 3-4 column grids

---

## 📚 Documentation

### Quick Start
- [Setup & Deployment Guide](./SETUP_AND_DEPLOYMENT.md) - Installation, configuration, deployment
- [Integration Testing Guide](./INTEGRATION_TESTING.md) - Complete testing scenarios and checklist
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions

### Validation
- Run integration validator: `node integration-validator.js`

---

## 🚀 Quick Start

### Development (Mock Mode - No Backend)

```bash
# Install dependencies
npm install

# Start dev server (uses mock data by default)
npm run dev

# Access at http://localhost:5173
```

**Mock credentials**:
- organizer@gateflow.ai / demo1234
- guard@gateflow.ai / demo1234
- admin@gateflow.ai / demo1234

### Production Build

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview

# Deploy (see SETUP_AND_DEPLOYMENT.md for Vercel, Netlify, AWS, Docker)
```

---

## 📋 Architecture

### Project Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── MetricCard.jsx     # Large number display with icon
│   │   ├── ActionCard.jsx     # Full-width action card
│   │   ├── StatusBadge.jsx    # Status indicator (inside/exited/overstayed)
│   │   ├── IconButton.jsx     # Icon-first buttons
│   │   ├── Skeleton.jsx       # Loading placeholders
│   │   └── index.js           # Barrel export
│   └── layout/
│       ├── DashboardLayout.jsx # Main layout with responsive sidebar
│       └── Sidebar.jsx
├── pages/
│   ├── auth/
│   │   └── LoginPage.jsx
│   ├── dashboard/
│   │   └── MainDashboard.jsx  # Organizer dashboard with 4 metric cards
│   ├── guard/
│   │   ├── GuardDashboard.jsx
│   │   ├── EntryScan.jsx      # Full-screen QR scanner
│   │   └── ExitScan.jsx
│   ├── walkins/
│   │   └── WalkInApprovals.jsx # Approve/reject walk-ins
│   └── visitor/
│       ├── VisitorPass.jsx    # Digital pass with huge QR code
│       └── VisitorChat.jsx
├── hooks/
│   ├── useDashboard.js        # Dashboard stats, entries, walkins
│   ├── useDashboardWS.js      # WebSocket connection
│   ├── useAuth.js             # Authentication logic
│   └── ... (other domain hooks)
├── services/
│   ├── http/
│   │   └── axiosInstance.js   # Axios with token refresh & mock mode
│   ├── authService.js
│   ├── dashboardService.js
│   ├── websocketService.js
│   └── ... (other domain services)
├── store/
│   ├── authStore.js           # Zustand auth state
│   ├── notificationStore.js
│   ├── spaceStore.js
│   └── visitorSessionStore.js
├── config/
│   └── env.js                 # Centralized environment config
├── mock/
│   ├── mockHandlers.js        # API request interceptor
│   └── mockData.js            # Mock data definitions
├── lib/
│   └── utils.js               # Utility functions
├── App.jsx
├── App.css
├── index.css                  # Global styles + CSS variables + color palette
└── main.jsx
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, JSX |
| **Build** | Vite (fast HMR, optimized bundles) |
| **Styling** | Tailwind CSS + CSS Variables |
| **UI Components** | Lucide React (icons), Custom (cards, badges) |
| **Charts** | Recharts (occupancy trends) |
| **State** | Zustand (auth, notifications, spaces) |
| **Data Fetching** | TanStack Query (caching, polling) |
| **HTTP** | Axios (with token refresh interceptor) |
| **Routing** | React Router v6 |
| **WebSocket** | Native WebSocket API |
| **Mock Mode** | Axios request interceptor |

---

## 🔧 Configuration

### Environment Variables

```env
# API endpoint
VITE_API_BASE_URL=http://localhost:8000

# WebSocket endpoint (ws or wss)
VITE_WS_BASE_URL=ws://localhost:8000

# RAG / AI microservice (optional)
VITE_RAG_BASE_URL=http://localhost:8001

# Mock mode (true for local dev without backend)
VITE_MOCK_MODE=true

# Environment
VITE_APP_ENV=development
```

See [SETUP_AND_DEPLOYMENT.md](./SETUP_AND_DEPLOYMENT.md) for full configuration guide.

---

## 🧪 Testing

### Quick Smoke Test (5 minutes)

```bash
npm run dev

# In browser:
# 1. Login with organizer@gateflow.ai / demo1234
# 2. Dashboard loads with 4 metric cards
# 3. Metric values display (inside, exited, overstayed, pending)
# 4. No console errors
# ✅ Passed
```

### Full Integration Testing

See [INTEGRATION_TESTING.md](./INTEGRATION_TESTING.md) for:
- Auth flow validation
- API endpoint verification
- WebSocket testing
- Mock mode functionality
- Mobile responsiveness
- Accessibility testing
- Error handling
- Performance validation

### Validation Script

```bash
# Check integration setup
node integration-validator.js

# Output: ✅ All checks passed or lists missing items
```

---

## 🚨 Common Issues

**"Cannot find module '@/components/ui/...'"**
→ Verify barrel export in [src/components/ui/index.js](./src/components/ui/index.js)

**"WebSocket connection failed"**
→ Check VITE_WS_BASE_URL and backend WebSocket endpoint

**"401 Unauthorized loop"**
→ Clear localStorage and re-login

**"Mock mode not working"**
→ Restart dev server after changing .env (environment variables loaded at startup)

**"Dark mode not applied"**
→ Verify CSS variables in [src/index.css](./src/index.css) and Tailwind darkMode config

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for 30+ solutions with code examples.

---

## 📊 Key Pages

### Guard Dashboard
- **URL**: `/guard/dashboard`
- **Features**: QuickActionBar with 4 buttons (entry scan, exit scan, walk-in, profile)
- **Design**: Full-screen, large 48px+ buttons, icon-driven

### Guard Entry Scan
- **URL**: `/guard/entry`
- **Features**: Large green "SCAN ENTRY" button, QR camera, instant visual feedback (✓)
- **Design**: Full-screen, 100vh viewport, auto-clear after 3 seconds

### Organizer Dashboard
- **URL**: `/dashboard`
- **Features**: 4 metric cards (inside/exited/overstayed/pending), alert banners, recent entries, quick actions
- **Real-Time**: WebSocket updates with fallback polling
- **Loading**: SkeletonTable while fetching

### Walk-in Approvals
- **URL**: `/walkins`
- **Features**: Grid of pending walk-ins, large approve/reject buttons, proof image preview
- **Design**: 3-column responsive grid, full-height buttons

### Visitor Pass
- **URL**: `/invite/:code`
- **Features**: Large QR code (256x256px), emoji icons, simple language, download/share buttons
- **Design**: Minimal, clean, no account required

---

## 🎨 Design System

### Color Palette

| Color | Hex | Usage | Light | Dark |
|-------|-----|-------|-------|------|
| Primary | #2563eb | Buttons, links | #2563eb | #3b82f6 |
| Success | #10b981 | Entry allowed, approved | #10b981 | #34d399 |
| Danger | #ef4444 | Blocked, overstay, rejected | #ef4444 | #f87171 |
| Warning | #f59e0b | Pending, walk-ins | #f59e0b | #fbbf24 |
| Info | #3b82f6 | Notifications, general | #3b82f6 | #60a5fa |

### Component Library

```jsx
// Buttons
<Button size="lg">Large</Button>
<Button variant="secondary">Secondary</Button>
<Button disabled>Disabled</Button>

// Cards
<Card>
  <CardHeader><CardTitle>Title</CardTitle></CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Metrics
<MetricCard 
  title="Inside" 
  value={42} 
  icon={DoorOpen}
  color="green"
/>

// Status Badges
<StatusBadge status="inside" />     {/* Green */}
<StatusBadge status="exited" />     {/* Blue */}
<StatusBadge status="overstayed" /> {/* Red */}

// Action Cards
<ActionCard
  title="Scan Entry"
  icon={DoorOpen}
  onClick={handleScan}
/>

// Skeleton Loaders
<SkeletonCard /> {/* Generic card skeleton */}
<SkeletonMetric /> {/* MetricCard skeleton */}
<SkeletonTable rows={6} /> {/* Table skeleton */}
```

---

## 🔐 Security

- **Token Refresh**: Automatic refresh on 401 (no user intervention needed)
- **HTTPS/WSS**: Production uses secure WebSocket (wss://)
- **CORS**: Backend configured to allow frontend origin
- **Input Sanitization**: User inputs validated before API calls
- **Error Messages**: Sensitive errors logged server-side, generic messages shown to user

---

## 📈 Performance

| Metric | Target | Status |
|--------|--------|--------|
| Bundle Size | < 250KB gzipped | ✅ |
| First Paint | < 2s | ✅ |
| Time to Interactive | < 4s | ✅ |
| Cumulative Layout Shift | < 0.1 | ✅ |

---

## 🌍 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+ (iOS)
- Chrome Mobile 90+ (Android)

---

## 📝 License

Private project for GateFlow AI. All rights reserved.

---

## 🤝 Contributing

Follow these conventions:

1. **Naming**: kebab-case for files, PascalCase for components
2. **Structure**: Colocate tests with components
3. **Imports**: Use path aliases (@/components, @/hooks, etc.)
4. **Exports**: Use barrel exports (index.js) for component libraries
5. **Accessibility**: Include aria-label on interactive elements
6. **Colors**: Use CSS variables, never hardcode hex values

---

## 📞 Support

### Documentation
- [Setup Guide](./SETUP_AND_DEPLOYMENT.md)
- [Integration Testing](./INTEGRATION_TESTING.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

### Run Validator
```bash
node integration-validator.js
```

### Resources
- React: https://react.dev
- Vite: https://vitejs.dev
- Tailwind: https://tailwindcss.com
- Lucide Icons: https://lucide.dev

---

## 🎯 Next Steps

**For Development**:
```bash
npm install
npm run dev
# Visit http://localhost:5173
```

**For Deployment**:
See [SETUP_AND_DEPLOYMENT.md](./SETUP_AND_DEPLOYMENT.md) for Vercel, Netlify, AWS, Docker configurations.

**For Testing**:
See [INTEGRATION_TESTING.md](./INTEGRATION_TESTING.md) for complete test scenarios.

---

**Last Updated**: May 2026 | **Status**: ✅ Phase 4 Complete (Accessibility & Performance)
