import { Outlet } from 'react-router-dom'
import { useAuth } from '@/app/auth'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { Grain } from '@/components/fx/Grain'
import { SmoothScroll } from '@/components/fx/SmoothScroll'

export function Shell() {
  const { user } = useAuth()
  return (
    <SmoothScroll>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[200] focus:bg-ink focus:p-3 focus:text-paper">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="min-h-screen pt-14">
        {/* Keyed by session so page state never leaks between accounts. */}
        <Outlet key={user?.token ?? 'guest'} />
      </main>
      <Footer />
      <Grain />
    </SmoothScroll>
  )
}

