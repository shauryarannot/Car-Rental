import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { Grain } from '@/components/fx/Grain'
import { SmoothScroll } from '@/components/fx/SmoothScroll'

export function Shell() {
  return (
    <SmoothScroll>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[200] focus:bg-ink focus:p-3 focus:text-paper">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="min-h-screen pt-14">
        <Outlet />
      </main>
      <Footer />
      <Grain />
    </SmoothScroll>
  )
}

