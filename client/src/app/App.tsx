import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeProvider } from './theme'
import { Shell } from '@/components/layout/Shell'
import Home from '@/pages/Home'
import NotFound from '@/pages/NotFound'

const Fleet = lazy(() => import('@/pages/Fleet'))
const CarDetail = lazy(() => import('@/pages/CarDetail'))
const Ticket = lazy(() => import('@/pages/Ticket'))
const MyBookings = lazy(() => import('@/pages/MyBookings'))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 60_000 } },
})

const page = (el: React.ReactNode) => <Suspense fallback={<div className="min-h-screen" />}>{el}</Suspense>

/** Booking now happens on the car page; keep /book/:id working. */
function BookRedirect() {
  const { id } = useParams()
  return <Navigate to={`/fleet/${id}`} replace />
}

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/fleet', element: page(<Fleet />) },
      { path: '/fleet/:id', element: page(<CarDetail />) },
      { path: '/book/:id', element: <BookRedirect /> },
      { path: '/bookings', element: page(<MyBookings />) },
      { path: '/bookings/:id', element: page(<Ticket />) },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" toastOptions={{ className: '!rounded-none !border-hairline !font-[var(--font-mono)]' }} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
