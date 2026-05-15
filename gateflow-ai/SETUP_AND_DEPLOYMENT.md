# GateFlow Frontend - Setup & Deployment Guide

## Quick Start

### Development (Mock Mode - No Backend Required)

```bash
# 1. Install dependencies
npm install

# 2. Create .env file (or use defaults)
echo 'VITE_MOCK_MODE=true' > .env.local

# 3. Start dev server
npm run dev

# App runs at http://localhost:5173
# Mock mode auto-intercepts all API calls
```

### Development (With Real Backend)

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local
cat > .env.local << 'EOF'
VITE_MOCK_MODE=false
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_RAG_BASE_URL=http://localhost:8001
VITE_APP_ENV=development
EOF

# 3. Ensure backend is running
# Start your FastAPI backend on port 8000

# 4. Start dev server
npm run dev
```

### Production Build

```bash
# 1. Build optimized bundle
npm run build

# Output in: dist/

# 2. Preview production build locally
npm run preview

# 3. Deploy to hosting (Vercel, Netlify, AWS S3+CloudFront, etc.)
```

---

## Environment Variables

### Complete .env Configuration

```env
# ══ API & BACKEND CONFIGURATION ═══════════════════════════════════════════════

# FastAPI backend base URL (no trailing slash)
# Local dev: http://localhost:8000
# Staging: https://staging-api.gateflow.ai
# Production: https://api.gateflow.ai
VITE_API_BASE_URL=http://localhost:8000

# WebSocket URL (protocol changes based on HTTPS)
# Local dev: ws://localhost:8000
# Production: wss://api.gateflow.ai (note: wss not ws)
VITE_WS_BASE_URL=ws://localhost:8000

# RAG / AI Microservice URL (optional)
# Used for document analysis and smart queries
# Local dev: http://localhost:8001
# Production: https://rag.gateflow.ai
VITE_RAG_BASE_URL=http://localhost:8001

# ══ APPLICATION ENVIRONMENT ════════════════════════════════════════════════════

# development | staging | production
VITE_APP_ENV=development

# Application name (for browser title, etc.)
VITE_APP_NAME=GateFlow AI

# ══ MOCK MODE ══════════════════════════════════════════════════════════════════

# When true: All API calls intercepted, mock data returned
# When false: Real backend calls made
# Set to 'true' for local development without backend
# Set to 'false' for CI/CD, staging, production
VITE_MOCK_MODE=true
```

### Environment-Specific Configs

#### `.env.development`
```env
VITE_MOCK_MODE=true
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_RAG_BASE_URL=http://localhost:8001
VITE_APP_ENV=development
VITE_APP_NAME=GateFlow AI (Dev)
```

#### `.env.staging`
```env
VITE_MOCK_MODE=false
VITE_API_BASE_URL=https://staging-api.gateflow.ai
VITE_WS_BASE_URL=wss://staging-api.gateflow.ai
VITE_RAG_BASE_URL=https://staging-rag.gateflow.ai
VITE_APP_ENV=staging
VITE_APP_NAME=GateFlow AI (Staging)
```

#### `.env.production`
```env
VITE_MOCK_MODE=false
VITE_API_BASE_URL=https://api.gateflow.ai
VITE_WS_BASE_URL=wss://api.gateflow.ai
VITE_RAG_BASE_URL=https://rag.gateflow.ai
VITE_APP_ENV=production
VITE_APP_NAME=GateFlow AI
```

---

## Running the Application

### Development Server

```bash
# Start with hot-reload
npm run dev

# Access at http://localhost:5173
# Changes auto-refresh in browser
```

### Production Build

```bash
# Build optimized bundle (minified, tree-shaken)
npm run build

# Output directory: dist/
# Size: ~200KB gzipped (including all dependencies)

# Test production build locally
npm run preview

# Access at http://localhost:4173
# Simulates production environment
```

### ESLint Validation

```bash
# Check for code issues
npm run lint

# Auto-fix issues where possible
npm run lint -- --fix
```

---

## Mock Mode Testing

### All Available Test Accounts

When `VITE_MOCK_MODE=true`, use these credentials:

| Email | Password | Role | Features |
|-------|----------|------|----------|
| `organizer@gateflow.ai` | `demo1234` | ORGANIZER | Dashboard, spaces, invites, approvals |
| `guard@gateflow.ai` | `demo1234` | GUARD | Entry/exit scanning, walk-in submission |
| `resident@gateflow.ai` | `demo1234` | RESIDENT | Limited dashboard, visitor management |
| `admin@gateflow.ai` | `demo1234` | ADMIN | Full system access |

### Mock Data Behavior

- **Persistence**: Mock data persists during browser session
- **Page Reload**: Mock data preserved across page reloads (in-memory)
- **New Tab**: New tab = new mock session (separate state)
- **Local Storage**: Auth tokens stored (mock tokens)
- **Mutations**: Create, update, delete operations work on mock data

### Example: Testing Walk-in Workflow in Mock Mode

```bash
# 1. Login as guard@gateflow.ai
# 2. Create a walk-in request (name, photo optional)
# 3. Logout, login as organizer@gateflow.ai
# 4. Navigate to /walkins
# 5. See the pending walk-in created in step 2
# 6. Approve or reject it
# 7. Changes reflected immediately
```

---

## Real Backend Integration

### Backend API Requirements

Ensure your FastAPI backend implements these endpoints:

```
Authentication
  POST /auth/login
  POST /auth/register
  POST /auth/refresh
  POST /auth/logout

Dashboard
  GET /dashboard/stats?space_id=<id>
  GET /dashboard/occupancy?space_id=<id>
  GET /dashboard/entries?space_id=<id>&limit=50
  GET /dashboard/walkins?space_id=<id>
  GET /dashboard/overstays?space_id=<id>

Entries
  POST /entries/scan
  POST /entries/<id>/exit
  GET /entries/<id>

Walk-ins
  GET /walkins?space_id=<id>
  POST /walkins/<id>/approve
  POST /walkins/<id>/reject

Spaces
  GET /spaces
  POST /spaces
  GET /spaces/<id>
  PUT /spaces/<id>

Invites
  GET /invites?space_id=<id>
  POST /invites
  GET /invites/<id>
  DELETE /invites/<id>

Notifications
  GET /notifications
  GET /notifications/<id>
  PATCH /notifications/<id>

WebSocket
  WS /ws/dashboard/{space_id}
    Events: ENTRY, EXIT, WALKIN
```

### Token Refresh Flow

The frontend automatically handles token refresh:

1. Client makes API request with `Authorization: Bearer <token>`
2. Backend responds with 401 (token expired)
3. Frontend calls `POST /auth/refresh` with `refresh_token`
4. Backend returns new `access_token`
5. Frontend retries original request with new token
6. If refresh fails: user redirected to login

No special configuration needed — handled in [src/services/http/axiosInstance.js](src/services/http/axiosInstance.js)

### CORS Configuration

Backend must allow requests from frontend origin:

```python
# FastAPI cors.py or main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Dev
        "https://app.gateflow.ai",  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### WebSocket Configuration

Backend must support WebSocket on same domain:

```python
# Backend: websocket/dashboard_ws.py
@app.websocket("/ws/dashboard/{space_id}")
async def websocket_endpoint(websocket: WebSocket, space_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Process and broadcast events
            await websocket.send_json({
                "event": "ENTRY",
                "visitor_name": "John Doe",
                "space_id": space_id,
                "session_id": "...",
                "gate_id": "Main Gate",
            })
    except Exception as e:
        # Handle errors
```

---

## Deployment

### Vercel (Recommended for Vite)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Set environment variables in Vercel dashboard
# Navigate to Project → Settings → Environment Variables
# Add: VITE_API_BASE_URL, VITE_WS_BASE_URL, VITE_RAG_BASE_URL, VITE_MOCK_MODE

# 4. Redeploy with env vars
vercel --prod
```

### Netlify

```bash
# 1. Connect GitHub repo to Netlify

# 2. Build settings:
# Build command: npm run build
# Publish directory: dist

# 3. Environment variables in Netlify dashboard:
# Site settings → Build & deploy → Environment
VITE_API_BASE_URL=https://api.gateflow.ai
VITE_WS_BASE_URL=wss://api.gateflow.ai
VITE_RAG_BASE_URL=https://rag.gateflow.ai
VITE_MOCK_MODE=false
VITE_APP_ENV=production
```

### AWS S3 + CloudFront

```bash
# 1. Build the app
npm run build

# 2. Upload dist/ to S3
aws s3 sync dist/ s3://gateflow-frontend-bucket/

# 3. Create CloudFront distribution pointing to S3
# In CloudFront, set default root object to index.html
# Add cache invalidation for / after upload

# 4. Set custom domain in Route 53
```

### Docker (For Containerized Deployment)

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ARG VITE_WS_BASE_URL
ARG VITE_RAG_BASE_URL
ARG VITE_MOCK_MODE=false
ARG VITE_APP_ENV=production
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build Docker image
docker build \
  --build-arg VITE_API_BASE_URL=https://api.gateflow.ai \
  --build-arg VITE_WS_BASE_URL=wss://api.gateflow.ai \
  --build-arg VITE_MOCK_MODE=false \
  -t gateflow-frontend:latest .

# Run container
docker run -p 80:80 gateflow-frontend:latest
```

---

## Performance Optimization

### Build Analysis

```bash
# Analyze bundle size
npm run build -- --analyze

# Output shows which dependencies take most space
# Common culprits: lucide-react icons, recharts, react-query
```

### Tree Shaking

The build automatically removes unused code:

- Unused imports removed
- Dead code eliminated
- Small bundle size (~200KB gzipped)

### Image Optimization

Place images in `public/` for best performance:

```jsx
// ✅ Good - static import, optimized
import logo from '@/assets/logo.png'

// ✅ Also good - public path
<img src="/images/logo.png" alt="Logo" />

// ❌ Avoid - external URL, slower
<img src="https://cdn.example.com/logo.png" alt="Logo" />
```

### Lazy Loading

Split code automatically via React Router:

```jsx
// ✅ Automatic code splitting
const Dashboard = lazy(() => import('@/pages/dashboard/MainDashboard'))

// Routes auto-split into separate chunks
```

---

## Monitoring & Logging

### Browser Console

Check for errors during development:

```bash
# Development server auto-logs errors
npm run dev

# Watch console for messages from:
# - axios errors
# - WebSocket errors
# - React errors
```

### Production Error Tracking

Consider integrating error tracking (optional):

```javascript
// Example with Sentry
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://<key>@sentry.io/<project>",
  environment: env.APP_ENV,
  tracesSampleRate: 0.1,
});
```

### Network Monitoring

DevTools Network tab shows:

- API response times
- WebSocket connection status
- Bundle sizes
- Cache performance

---

## CI/CD Pipeline Example

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm ci
      - run: npm run lint
      - run: npm run build
        env:
          VITE_API_BASE_URL: https://api.gateflow.ai
          VITE_WS_BASE_URL: wss://api.gateflow.ai
          VITE_MOCK_MODE: 'false'
          VITE_APP_ENV: production
      
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## Troubleshooting

### Issue: "Cannot find module '@/components/ui/Skeleton'"

**Solution**: Ensure all imports use the barrel export:

```javascript
// ✅ Correct
import { Skeleton, SkeletonCard, SkeletonTable } from '@/components/ui'

// ❌ Avoid direct import
import { Skeleton } from '@/components/ui/Skeleton'
```

### Issue: WebSocket Connection Fails

**Check**:
1. Backend is running on correct port
2. WebSocket URL is correct: `ws://` (dev) or `wss://` (production)
3. Backend accepts WebSocket upgrade
4. Firewall/proxy allows WebSocket

**Test locally**:
```bash
# Check if WebSocket endpoint responds
wscat -c ws://localhost:8000/ws/dashboard/test-space
```

### Issue: CORS Errors in Console

**Solution**: Backend must allow frontend origin

```python
# Backend main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://app.gateflow.ai"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: "401 Unauthorized" Loop

**Check**:
1. Refresh token is valid
2. Backend `/auth/refresh` endpoint works
3. Token refresh not in infinite loop
4. Clear browser storage and re-login

```bash
# Clear auth tokens
localStorage.clear()
sessionStorage.clear()

# Reload and login again
```

### Issue: Mock Mode Not Working

**Check**:
1. `VITE_MOCK_MODE=true` in .env file
2. Restart dev server after changing .env
3. Check if mock handler covers the endpoint
4. Verify credentials: use `demo1234` password

```bash
# Verify mock mode enabled
echo $VITE_MOCK_MODE  # Should print: true
```

---

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Bundle Size | < 250KB gzipped | ✅ |
| First Contentful Paint | < 2s | ✅ |
| Largest Contentful Paint | < 3s | ✅ |
| Cumulative Layout Shift | < 0.1 | ✅ |
| Time to Interactive | < 4s | ✅ |

---

## Support & Documentation

- **Vite Docs**: https://vitejs.dev
- **React Router**: https://reactrouter.com
- **TanStack Query**: https://tanstack.com/query
- **Tailwind CSS**: https://tailwindcss.com
- **Lucide Icons**: https://lucide.dev
- **Recharts**: https://recharts.org

---

## Deployment Checklist

- [ ] All environment variables set correctly
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in production build
- [ ] ESLint passes: `npm run lint`
- [ ] Mock mode disabled: `VITE_MOCK_MODE=false`
- [ ] API URLs point to correct endpoints
- [ ] WebSocket URLs use `wss://` for HTTPS
- [ ] Backend CORS configured for frontend domain
- [ ] Backend `/auth/refresh` endpoint working
- [ ] WebSocket endpoint `/ws/dashboard/{space_id}` working
- [ ] Error logging configured
- [ ] Performance monitoring enabled
- [ ] SSL/HTTPS certificate valid
- [ ] DNS records point to deployment
- [ ] Smoke test completed (login, dashboard, scan)

