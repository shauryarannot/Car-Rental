import { Link } from 'react-router-dom'
import { useAuth } from '@/app/auth'

export function Footer() {
  const { user, isAdmin, isCustomer } = useAuth()
  return (
    <footer className="relative overflow-hidden border-t border-hairline bg-background">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-6 px-4 pt-12 sm:grid-cols-4 sm:px-6 sm:pt-16">
        <div className="col-span-2">
          <p className="serif-italic text-2xl sm:text-3xl">Pick a car. Pick your days. Go.</p>
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
            <>
              <Link to="/login" className="hover:underline">Sign in</Link>
              <Link to="/signup" className="hover:underline">Sign up</Link>
            </>
          )}
        </div>
        <address className="mono-label flex flex-col gap-2 not-italic">
          <span className="text-muted-foreground">Office</span>
          <span>Motherson Fleet Operations</span>
        </address>
      </div>
      <p aria-hidden className="wordmark select-none whitespace-nowrap px-4 pb-4 pt-8 text-center text-[clamp(2.75rem,15vw,13.5rem)] leading-none text-ink sm:pt-10">
        Ryde.exe
      </p>
    </footer>
  )
}
