import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { ToastProvider } from '@/components/ui/Toast'
import { publicRoutesFor } from '@/routes/publicRoutes'

// Public visitors and admin staff are different audiences reading different code — lazy-loading
// the whole admin CMS keeps its bundle (forms, tables, react-hook-form/zod usage) out of the
// public site's initial download. See docs/PROGRESS.md code-splitting entry.
const AdminApp = lazy(() => import('@/admin/AdminApp'))

function AdminLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {publicRoutesFor('ru', '/')}
            {publicRoutesFor('en', '/en')}
            {publicRoutesFor('tg', '/tg')}
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<AdminLoadingFallback />}>
                  <AdminApp />
                </Suspense>
              }
            />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
