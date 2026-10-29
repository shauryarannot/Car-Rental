import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/app/theme'
import { cn } from '@/lib/utils'

const links = [
  { to: '/fleet', label: 'Fleet' },
  { to: '/bookings', label: 'My bookings' },
]

/** Slim hairline bar. Red bright at the top of the page, paper with a hairline after scroll. Hides on scroll down. */
export function Navbar() {
  const { theme, toggle } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 80)
      setHidden(y > last && y > 240)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-[transform,background-color] duration-[400ms] ease-odo',
        scrolled ? 'border-hairline bg-background text-ink' : 'border-transparent bg-red-bright text-white',
        hidden && !open && '-translate-y-full',
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

