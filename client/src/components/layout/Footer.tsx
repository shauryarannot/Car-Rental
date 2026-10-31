import { Link } from 'react-router-dom'
import { useAuth } from '@/app/auth'

export function Footer() {
  const { user, isAdmin, isCustomer } = useAuth()
  return (
    <footer className="relative overflow-hidden border-t border-hairline bg-background">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-6 px-6 pt-20 sm:grid-cols-4">
        <div className="col-span-2">
          <p className="serif-italic text-3xl">Pick a car. Pick your days. Go.</p>
        </div>
        <div className="mono-label flex flex-col gap-2">
          <span className="text-muted-foreground">Index</span>
          {user ? (
            <>
              <Link to="/fleet" className="hover:underline">Fleet</Link>
              {isCustomer && <Link to="/bookings" className="hover:underline">My bookings</Link>}
              {isAdmin && <Link to="/admin" className="hover:underline">Admin console</Link>}
            </>
          ) : (
            <Link to="/login" className="hover:underline">Sign in / Register</Link>
          )}
        </div>
        <address className="mono-label flex flex-col gap-2 not-italic">
          <span className="text-muted-foreground">Office</span>
          <span>Motherson Fleet Operations</span>
        </address>
      </div>
      <p aria-hidden className="wordmark select-none whitespace-nowrap pt-10 text-center text-[32vw] leading-[0.72] text-ink">
        ODO
      </p>
    </footer>
  )
}
