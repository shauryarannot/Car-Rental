import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useLocation, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeProvider } from './theme'
import { AuthProvider, useAuth } from './auth'
import type { Role } from '@/api/types'
import { Shell } from '@/components/layout/Shell'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'

const Fleet = lazy(() => import('@/pages/Fleet'))
const CarDetail = lazy(() => import('@/pages/CarDetail'))
const Ticket = lazy(() => import('@/pages/Ticket'))
const MyBookings = lazy(() => import('@/pages/MyBookings'))
const Admin = lazy(() => import('@/pages/Admin'))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 60_000 } },
})

const page = (el: ReactNode) => <Suspense fallback={<div className="min-h-screen" />}>{el}</Suspense>

/** Require a valid JWT session (and optionally a role); redirect everyone else. */
function RequireAuth({ children, role }: { children: ReactNode; role?: Role }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  }
  if (role && user.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}

/** Booking happens on the car detail page; keep /book/:id working. */
function BookRedirect() {
  const { id } = useParams()
  return <Navigate to={`/fleet/${id}`} replace />
}

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/', element: <RequireAuth><Home /></RequireAuth> },
      { path: '/fleet', element: <RequireAuth>{page(<Fleet />)}</RequireAuth> },
      { path: '/fleet/:id', element: <RequireAuth>{page(<CarDetail />)}</RequireAuth> },
      { path: '/book/:id', element: <RequireAuth><BookRedirect /></RequireAuth> },
      { path: '/bookings', element: <RequireAuth role="CUSTOMER">{page(<MyBookings />)}</RequireAuth> },
      { path: '/bookings/:id', element: <RequireAuth>{page(<Ticket />)}</RequireAuth> },
      { path: '/admin', element: <RequireAuth role="ADMIN">{page(<Admin />)}</RequireAuth> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster position="bottom-right" toastOptions={{ className: '!rounded-none !border-hairline !font-[var(--font-mono)]' }} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
