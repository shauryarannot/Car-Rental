import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'motion/react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/app/theme'
import { cn } from '@/lib/utils'

const links = [
  { to: '/fleet', label: 'Fleet' },
  { to: '/bookings', label: 'My bookings' },
]

/** Fixed top navbar. Stays pinned at top-0 and shows a subtle hairline scroll progress bar. */
export function Navbar() {
  const { theme, toggle } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.2 })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-[400ms] ease-odo',
        scrolled ? 'border-hairline bg-background/95 text-ink backdrop-blur-sm' : 'border-transparent bg-red-bright text-white',
      )}
    >
      <nav aria-label="Primary" className="mx-auto flex h-14 max-w-[1440px] items-center gap-8 px-6">
        <Link to="/" className="wordmark text-xl">ODO</Link>
        <ul className="hidden items-center gap-6 sm:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} className={({ isActive }) => cn('text-sm font-medium underline-offset-8 hover:underline', isActive && 'underline')}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            onClick={toggle}
            aria-pressed={theme === 'dark'}
            aria-label="Toggle Night Drive theme"
            className="mono-label flex min-h-11 items-center gap-2 px-1"
          >
            <span className={theme === 'light' ? 'underline underline-offset-4' : 'opacity-60'}>Light</span>
            <span aria-hidden>/</span>
            <span className={theme === 'dark' ? 'underline underline-offset-4' : 'opacity-60'}>Night</span>
          </button>
          <Button asChild className={cn('hidden min-h-9 sm:inline-flex', !scrolled && 'bg-white text-red-deep hover:bg-red-tint')}>
            <Link to="/fleet">Book</Link>
          </Button>
          <button
            type="button"
            className="mono-label min-h-11 min-w-11 sm:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </nav>

      {/* Subtle scroll progress hairline along the bottom edge of the fixed navbar */}
      <motion.div
        aria-hidden
        style={{ scaleX }}
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left',
          scrolled ? 'bg-signal' : 'bg-white/75',
        )}
      />

      {open && (
        <ul id="mobile-menu" className="border-t border-hairline bg-background px-6 py-4 text-ink sm:hidden">
          {[...links, { to: '/fleet', label: 'Book' }].map((l) => (
            <li key={l.label}>
              <Link to={l.to} onClick={() => setOpen(false)} className="flex min-h-11 items-center text-lg font-medium">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}
