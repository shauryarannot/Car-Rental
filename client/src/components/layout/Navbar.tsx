import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'motion/react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/app/theme'
import { useAuth } from '@/app/auth'
import { cn } from '@/lib/utils'

/** Fixed top navbar with role-based navigation (Customer vs Admin) and scroll progress hairline. */
export function Navbar() {
  const { theme, toggle } = useTheme()
  const { user, isAdmin, isCustomer, logout } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
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

  const links = [
    ...(user ? [{ to: '/fleet', label: 'Fleet' }] : []),
    ...(isCustomer ? [{ to: '/bookings', label: 'My bookings' }] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Admin console' }] : []),
  ]

  const handleLogout = () => {
    logout()
    qc.clear()
    setOpen(false)
    navigate('/login')
  }

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-[400ms] ease-odo',
        scrolled ? 'border-hairline bg-background/95 text-ink backdrop-blur-sm' : 'border-transparent bg-red-bright text-white',
      )}
    >
      <nav aria-label="Primary" className="mx-auto flex h-14 max-w-[1440px] items-center gap-8 px-6">
        <Link to={user ? '/' : '/login'} className="wordmark text-xl">
          ODO
        </Link>

        <ul className="hidden items-center gap-6 sm:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) => cn('text-sm font-medium underline-offset-8 hover:underline', isActive && 'underline')}
              >
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

          {user ? (
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex items-center gap-2 border border-current/25 px-2.5 py-1">
                <span
                  className={cn(
                    'mono-label px-1.5 py-0.5 text-[10px]',
                    isAdmin
                      ? scrolled
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white text-red-deep'
                      : scrolled
                        ? 'bg-surface-alt text-ink'
                        : 'bg-white/20 text-white',
                  )}
                >
                  {user.role}
                </span>
                <span className="mono-label max-w-36 truncate">{user.name}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mono-label min-h-9 border border-current/30 px-3 transition-colors duration-200 hover:bg-ink hover:text-paper"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Button asChild className={cn('hidden min-h-9 sm:inline-flex', !scrolled && 'bg-white text-red-deep hover:bg-red-tint')}>
              <Link to="/login">Sign in</Link>
            </Button>
          )}

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
          {links.map((l) => (
            <li key={l.label}>
              <Link to={l.to} onClick={() => setOpen(false)} className="flex min-h-11 items-center text-lg font-medium">
                {l.label}
              </Link>
            </li>
          ))}
          {user ? (
            <li className="mt-2 border-t border-hairline pt-3">
              <p className="mono-label text-muted-foreground">
                Signed in as {user.name} ({user.role})
              </p>
              <button type="button" onClick={handleLogout} className="mono-label mt-2 min-h-11 text-red-deep">
                Sign out →
              </button>
            </li>
          ) : (
            <li>
              <Link to="/login" onClick={() => setOpen(false)} className="flex min-h-11 items-center text-lg font-medium text-red-deep">
                Sign in
              </Link>
            </li>
          )}
        </ul>
      )}
    </header>
  )
}
