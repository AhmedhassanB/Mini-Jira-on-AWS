import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import { Toaster, toast } from 'sonner'
import './index.css'
import App from './App.jsx'

// React Query v5 removed onError from useQuery — use QueryCache for global error handling
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only toast on initial load failure (not background refetch noise)
      if (query.state.fetchStatus === 'idle') return
      const msg = error?.error || error?.message || 'Failed to load data from server'
      toast.error(msg, { id: query.queryHash, duration: 5000 })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
