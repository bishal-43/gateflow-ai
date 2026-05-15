import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { useTheme } from '@/hooks/useTheme'

function AppWithTheme() {
  useTheme()
  return <App />
}

// Wire axios interceptor to auth store (avoids circular import)
import { setAuthStoreGetter } from '@/services/http/axiosInstance'
import { useAuthStore } from '@/store/authStore'
setAuthStoreGetter(() => useAuthStore.getState())

// TanStack Query client — global config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: (failureCount, error) => {
        // Don't retry on 401/403/404
        if ([401, 403, 404].includes(error?.status)) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppWithTheme />
    </QueryClientProvider>
  </StrictMode>,
)
