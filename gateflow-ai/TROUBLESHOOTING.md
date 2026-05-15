# GateFlow Frontend - Quick Troubleshooting Guide

## Common Issues & Solutions

### 🔴 Error: "Cannot read property of undefined" in Components

**Problem**: Component tries to render data before it's loaded

**Solution**:
```jsx
// ❌ Incorrect
<div>{data.name}</div>  // Crashes if data is undefined

// ✅ Correct - Use optional chaining
<div>{data?.name}</div>

// ✅ Better - Check loading state
{isLoading ? <Skeleton /> : <div>{data.name}</div>}
```

---

### 🔴 Error: "Module not found: '@/components/ui/...'"

**Problem**: Import path incorrect or barrel export missing

**Solution**:
```javascript
// ❌ Wrong
import MetricCard from '@/components/ui/MetricCard'

// ✅ Correct - Named import with barrel export
import { MetricCard } from '@/components/ui'

// Verify in src/components/ui/index.js:
// export { MetricCard } from './MetricCard'
```

---

### 🔴 Error: "Websocket connection failed"

**Problem**: WebSocket URL incorrect or backend not listening

**Solution**:

1. **Check URL format**:
   ```env
   # Development (local)
   VITE_WS_BASE_URL=ws://localhost:8000
   
   # Production (HTTPS)
   VITE_WS_BASE_URL=wss://api.gateflow.ai
   ```

2. **Test WebSocket connectivity**:
   ```bash
   # Install wscat
   npm install -g wscat
   
   # Test connection
   wscat -c ws://localhost:8000/ws/dashboard/test-space-id
   ```

3. **Check backend WebSocket endpoint**:
   ```python
   @app.websocket("/ws/dashboard/{space_id}")
   async def dashboard_ws(websocket: WebSocket, space_id: str):
       await websocket.accept()
       # ... handle messages
   ```

---

### 🔴 Error: "401 Unauthorized - Token Expired"

**Problem**: Access token expired, refresh failed

**Solution**:

1. **Check token refresh endpoint**:
   ```bash
   curl -X POST http://localhost:8000/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refresh_token":"your-refresh-token"}'
   ```

2. **Verify backend returns new token**:
   ```python
   # Should return
   {
     "access_token": "new-token",
     "refresh_token": "new-refresh-token",
     "token_type": "bearer"
   }
   ```

3. **Clear and re-login if stuck**:
   ```javascript
   // In browser console
   localStorage.clear()
   sessionStorage.clear()
   location.href = '/login'
   ```

---

### 🔴 Error: "CORS error - Access-Control-Allow-Origin"

**Problem**: Backend doesn't allow requests from frontend origin

**Solution** - Add CORS middleware to backend:

```python
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
    expose_headers=["*"],
)
```

---

### 🔴 Error: "MetricCard not rendering - Skeleton stuck"

**Problem**: Data hook loading indefinitely

**Solution**:

1. **Check if hook is enabled**:
   ```javascript
   // Hooks should have enabled condition
   useQuery({
     queryKey: ['stats'],
     queryFn: () => dashboardService.getStats(spaceId),
     enabled: !!spaceId,  // ✅ Only fetch when spaceId exists
   })
   ```

2. **Verify API endpoint returns data**:
   ```bash
   curl http://localhost:8000/dashboard/stats?space_id=test-123 \
     -H "Authorization: Bearer your-token"
   ```

3. **Check Network tab in DevTools**:
   - Verify request was sent
   - Check response status (should be 200)
   - Verify response data structure

---

### 🔴 Error: "Mock mode not intercepting requests"

**Problem**: Requests going to real backend despite `VITE_MOCK_MODE=true`

**Solution**:

1. **Restart dev server**:
   ```bash
   # Environment variables only loaded on startup
   npm run dev  # Stop and restart
   ```

2. **Verify .env file**:
   ```bash
   cat .env  # Should show VITE_MOCK_MODE=true
   ```

3. **Check if mock handler covers endpoint**:
   ```javascript
   // In src/mock/mockHandlers.js
   // Verify your endpoint is handled:
   if (url.includes('/your/endpoint') && method === 'post') {
     return ok({ /* mock data */ })
   }
   ```

4. **Test in browser console**:
   ```javascript
   // In DevTools → Console
   import { handleMockRequest } from '@/mock/mockHandlers'
   const result = await handleMockRequest({
     method: 'get',
     url: '/dashboard/stats',
     params: { space_id: 'test' }
   })
   console.log(result)
   ```

---

### 🔴 Error: "Dark mode not working"

**Problem**: CSS variables not loaded or Tailwind dark mode not configured

**Solution**:

1. **Verify src/index.css has dark mode variables**:
   ```css
   @media (prefers-color-scheme: dark) {
     :root {
       --color-bg: #1f2937;
       --color-text: #f9fafb;
       /* ... more variables */
     }
   }
   ```

2. **Check tailwind.config.js**:
   ```javascript
   export default {
     darkMode: 'media',  // or 'class'
     // ...
   }
   ```

3. **Toggle system dark mode**:
   - **Mac**: System Preferences → General → Appearance → Dark
   - **Windows**: Settings → Personalization → Colors → Dark
   - **Browser**: DevTools → ⋯ → More tools → Rendering → Check "Emulate CSS media feature prefers-color-scheme"

---

### 🔴 Error: "Logout not working - Still logged in"

**Problem**: Auth store not clearing or redirect not happening

**Solution**:

1. **Check logout function**:
   ```javascript
   // In authStore.js, logout should:
   logout: () => {
     // 1. Clear tokens
     set({ token: null, refreshToken: null, user: null })
     // 2. Clear storage
     localStorage.removeItem('auth')
     // 3. Redirect
     window.location.href = '/login'
   }
   ```

2. **Test in browser console**:
   ```javascript
   import { useAuthStore } from '@/store/authStore'
   const store = useAuthStore.getState()
   store.logout()
   ```

3. **Verify tokens cleared**:
   ```javascript
   // In console
   localStorage.getItem('auth')  // Should be null
   ```

---

### 🔴 Error: "StatusBadge not showing correct color"

**Problem**: Status prop not recognized or Tailwind classes not applied

**Solution**:

1. **Verify status prop values**:
   ```jsx
   // Valid status values
   <StatusBadge status="inside" />    // Green
   <StatusBadge status="exited" />    // Blue
   <StatusBadge status="overstayed" /> // Red
   <StatusBadge status="pending" />    // Amber
   ```

2. **Check Tailwind CSS is loaded**:
   ```html
   <!-- In index.html -->
   <link rel="stylesheet" href="/src/index.css" />
   ```

3. **Verify color definitions in index.css**:
   ```css
   .badge-inside { @apply bg-green-100 text-green-700; }
   .badge-exited { @apply bg-blue-100 text-blue-700; }
   /* etc. */
   ```

---

### 🟡 Warning: "useQuery key not unique"

**Problem**: Multiple hooks using same query key

**Solution**:

```javascript
// ❌ Wrong - same key
useQuery({
  queryKey: ['stats'],  // Too generic
  queryFn: () => getStats(spaceId)
})

// ✅ Correct - unique key including params
useQuery({
  queryKey: ['stats', spaceId],  // Unique per space
  queryFn: () => getStats(spaceId)
})
```

---

### 🟡 Warning: "Missing dependency in useEffect"

**Problem**: useEffect has missing dependency

**Solution**:

```javascript
// ❌ Wrong - missing spaceId
useEffect(() => {
  fetchData(spaceId)
}, [])  // Missing dependency

// ✅ Correct - include all used variables
useEffect(() => {
  fetchData(spaceId)
}, [spaceId])
```

---

### 🟡 Performance: "Page slow to load"

**Problem**: Large bundle or excessive re-renders

**Solution**:

1. **Analyze bundle size**:
   ```bash
   npm run build -- --analyze
   ```

2. **Check for unnecessary re-renders**:
   ```jsx
   // Add React.memo for expensive components
   export const MetricCard = React.memo(function MetricCard(props) {
     // Component only re-renders if props change
   })
   ```

3. **Use useMemo for expensive calculations**:
   ```javascript
   const memoizedValue = useMemo(() => {
     return expensiveCalculation(data)
   }, [data])
   ```

4. **Lazy load heavy components**:
   ```javascript
   const HeavyChart = lazy(() => import('./HeavyChart'))
   ```

---

### 🟡 Mobile: "Touch targets too small"

**Problem**: Buttons <48px, hard to tap on mobile

**Solution**:

```jsx
// ❌ Too small
<button className="px-2 py-1">Click</button>

// ✅ 48px minimum
<button className="px-4 py-3 min-h-[48px] min-w-[48px]">Click</button>

// Better - use size prop
<Button size="lg">Click</Button>  // h-12 w-full
```

---

### 🟢 Best Practice: "Reusable API call"

**Problem**: Copying API calls across components

**Solution** - Create custom hook:

```javascript
// ✅ Create in src/hooks/useMyData.js
export function useMyData(id) {
  return useQuery({
    queryKey: ['mydata', id],
    queryFn: () => myService.getData(id),
    enabled: !!id,
  })
}

// Use everywhere
const { data, isLoading } = useMyData(id)
```

---

### 🟢 Best Practice: "Global state management"

**Problem**: Prop drilling getting out of hand

**Solution** - Use Zustand store:

```javascript
// ✅ Create in src/store/myStore.js
import { create } from 'zustand'

export const useMyStore = create((set) => ({
  value: null,
  setValue: (v) => set({ value: v }),
}))

// Use in any component
const { value, setValue } = useMyStore()
```

---

## Testing Checklist

Before deployment, verify:

- [ ] All pages load without errors
- [ ] MetricCards display correct data
- [ ] WebSocket connection shows "Live"
- [ ] Entry/exit scanning works (or mock data shows)
- [ ] Walk-in approval works
- [ ] Dark mode toggles
- [ ] Mobile layout responsive
- [ ] No console errors
- [ ] API calls include Authorization header
- [ ] Error messages display clearly

---

## Performance Checklist

- [ ] Bundle size < 250KB gzipped
- [ ] First paint < 2 seconds
- [ ] No layout shifts
- [ ] Smooth scrolling (60fps)
- [ ] No unnecessary re-renders
- [ ] Images optimized
- [ ] Lazy loading enabled

---

## Quick Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check code quality
npm run lint

# Validate integration setup
node integration-validator.js

# Test with mock mode
VITE_MOCK_MODE=true npm run dev

# Test with real backend
VITE_MOCK_MODE=false VITE_API_BASE_URL=http://api.local npm run dev
```

---

## Resources

- **Vite**: https://vitejs.dev
- **React**: https://react.dev
- **React Router**: https://reactrouter.com
- **Axios**: https://axios-http.com
- **TanStack Query**: https://tanstack.com/query
- **Tailwind**: https://tailwindcss.com
- **Lucide Icons**: https://lucide.dev

---

## Still Stuck?

1. **Check browser console** for error messages (Cmd+Opt+J / Ctrl+Shift+J)
2. **Check Network tab** for failed API calls
3. **Check DevTools → Sources** for debugging
4. **Check backend logs** for server errors
5. **Run validator**: `node integration-validator.js`

