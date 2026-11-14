import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'motion/react'
import { Button } from '@/components/ui/button'
import { useTheme, type Theme } from '@/app/theme'
import { useAuth } from '@/app/auth'
import { cn } from '@/lib/utils'

const themeOptions: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

/** Fixed top navbar with role-based navigation (Customer vs Admin) and scroll progress hairline. */
export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { user, isAdmin, isCustomer, isEmployee, logout } = useAuth()
  const roleLabel = isEmployee ? 'Motherson' : user?.role
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const themeRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.2 })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!themeOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setThemeOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [themeOpen])

  const links = [
    ...(user ? [{ to: '/fleet', label: 'Fleet' }] : []),
    ...(isCustomer ? [{ to: '/bookings', label: 'My bookings' }] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Admin console' }] : []),
  ]

  const handleLogout = () => {
    logout()
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
      <nav aria-label="Primary" className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:gap-6 sm:px-6 lg:gap-8">
        <Link to="/" className="wordmark shrink-0 text-xl">
          Ryde.exe
        </Link>

        <ul className="hidden items-center gap-6 md:flex">
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

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <div ref={themeRef} className="relative">
            <button
              type="button"
              onClick={() => setThemeOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={themeOpen}
              className="mono-label flex min-h-11 items-center gap-1.5 px-2 transition-opacity hover:opacity-80"
            >
              <span>Theme</span>
              <span aria-hidden className={cn('text-[10px] transition-transform duration-200', themeOpen && 'rotate-180')}>
                ▾
              </span>
            </button>

            {themeOpen && (
              <div
                role="menu"
                aria-label="Select theme"
                className=" absolute right-0 top-full z-50 mt-1 min-w-32 border border-hairline bg-card py-1 text-ink shadow-sm"
              >
                {themeOptions.map((opt) => {
                  const active = theme === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        setTheme(opt.value)
                        setThemeOpen(false)
                      }}
                      className={cn(
                        'mono-label flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-surface-alt',
                        active ? 'font-semibold text-red-deep' : 'text-ink',
                      )}
                    >
                      <span>{opt.label}</span>
                      {active && <span aria-hidden className="size-1.5 rounded-full bg-red-deep" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {user ? (
            <div className="hidden items-center gap-3 md:flex">
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
                  {roleLabel}
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
            <Button asChild className={cn('hidden min-h-9 md:inline-flex', !scrolled && 'bg-white text-red-deep hover:bg-red-tint')}>
              <Link to="/login">Sign in</Link>
            </Button>
          )}

          <button
            type="button"
            className="mono-label min-h-11 min-w-11 md:hidden"
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
        <ul id="mobile-menu" className="border-t border-hairline bg-background px-4 py-4 text-ink sm:px-6 md:hidden">
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
                Signed in as {user.name} ({roleLabel})
              </p>
              <button type="button" onClick={handleLogout} className="mono-label mt-2 min-h-11 text-red-deep">
                Sign out →
              </button>
            </li>
          ) : (
            <li className="space-y-1">
              <Link to="/login" onClick={() => setOpen(false)} className="flex min-h-11 items-center text-lg font-medium text-red-deep">
                Sign in
              </Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="flex min-h-11 items-center text-lg font-medium">
                Sign up
              </Link>
            </li>
          )}
        </ul>
      )}
    </header>
  )
}
