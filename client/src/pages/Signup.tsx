import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, isApiError } from '@/api'
import { useAuth } from '@/app/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const alertClass = 'flex items-center gap-2 border border-red-deep/40 bg-[var(--odo-red-tint)] px-3 py-2 text-sm text-red-deep'

interface RegisterFields {
  name: string
  email: string
  password: string
  phone: string
  employeeId: string
}

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: string } | null)?.from

  const [regData, setRegData] = useState<RegisterFields>({
    name: '',
    email: '',
    password: '',
    phone: '',
    employeeId: '',
  })
  const [regErrors, setRegErrors] = useState<Partial<RegisterFields>>({})

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFields) => {
      await api.register({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        phone: data.phone.trim() || undefined,
        employeeId: data.employeeId.trim() || undefined,
      })
      return api.login({ email: data.email.trim(), password: data.password })
    },
    onSuccess: (res, vars) => {
      login(res, vars.email.trim(), vars.employeeId)
      toast.success('Account created. Welcome aboard.')
      navigate(from && from !== '/login' && from !== '/signup' ? from : '/', { replace: true })
    },
    onError: (e) => toast.error(isApiError(e) ? e.message : 'Could not register account.'),
  })

  const handleRegisterSubmit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Partial<RegisterFields> = {}
    if (regData.name.trim().length < 2) errs.name = 'Enter your full name.'
    if (!EMAIL_RE.test(regData.email.trim())) errs.email = 'Enter a valid email address.'
    if (regData.password.length < 6) errs.password = 'Password must be at least 6 characters.'
    setRegErrors(errs)
    if (!Object.keys(errs).length) {
      registerMutation.mutate(regData)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[1440px] items-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 sm:gap-12 lg:grid-cols-2">
        <div>
          <p className="mono-label text-red-deep">Join Ryde.exe</p>
          <h1 className="mt-3 text-[clamp(2.5rem,6.5vw,5.5rem)] font-extrabold leading-[0.92] tracking-[-0.03em] [font-variation-settings:'wdth'_125] sm:mt-4">
            Create your <span className="serif-italic font-normal text-red-deep">account.</span>
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Register in a minute to reserve cars, apply offers and keep track of every trip.
          </p>
        </div>

        <div className="ticks border border-hairline bg-card p-6 sm:p-10">
          <div className="border-b border-hairline pb-4">
            <p className="mono-label text-ink">Customer registration</p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="mt-8 space-y-5" noValidate>
            <Input
              label="Full name"
              autoComplete="name"
              placeholder="Your full name"
              value={regData.name}
              error={regErrors.name}
              onChange={(e) => setRegData({ ...regData, name: e.target.value })}
            />
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={regData.email}
              error={regErrors.email}
              onChange={(e) => setRegData({ ...regData, email: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={regData.password}
              error={regErrors.password}
              onChange={(e) => setRegData({ ...regData, password: e.target.value })}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Phone (optional)"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98…"
                value={regData.phone}
                onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
              />
              <Input
                label="Employee ID (optional)"
                placeholder="For staff offers"
                value={regData.employeeId}
                onChange={(e) => setRegData({ ...regData, employeeId: e.target.value })}
              />
            </div>

            {registerMutation.isError && (
              <p role="alert" className={alertClass}>
                <span className="mono font-bold">!</span>
                {isApiError(registerMutation.error) ? registerMutation.error.message : 'Registration failed.'}
              </p>
            )}

            <Button type="submit" arrow className="min-h-12 w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 border-t border-hairline pt-6 text-center text-sm text-muted-foreground">
            Already a customer?{' '}
            <Link
              to="/login"
              state={location.state}
              className="font-medium text-red-deep underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
