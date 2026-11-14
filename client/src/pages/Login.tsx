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

interface LoginFields {
  email: string
  password: string
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: string } | null)?.from

  const [loginData, setLoginData] = useState<LoginFields>({ email: '', password: '' })
  const [loginErrors, setLoginErrors] = useState<Partial<LoginFields>>({})

  const signInMutation = useMutation({
    mutationFn: (data: LoginFields) => api.login(data),
    onSuccess: (res, vars) => {
      login(res, vars.email)
      toast.success('Signed in successfully.')
      navigate(from && from !== '/login' && from !== '/signup' ? from : res.role === 'ADMIN' ? '/admin' : '/', {
        replace: true,
      })
    },
    onError: (e) => toast.error(isApiError(e) ? e.message : 'Invalid email or password.'),
  })

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Partial<LoginFields> = {}
    if (!EMAIL_RE.test(loginData.email.trim())) errs.email = 'Enter a valid email address.'
    if (!loginData.password) errs.password = 'Enter your password.'
    setLoginErrors(errs)
    if (!Object.keys(errs).length) {
      signInMutation.mutate({ email: loginData.email.trim(), password: loginData.password })
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[1440px] items-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 sm:gap-12 lg:grid-cols-2">
        <div>
          <p className="mono-label text-red-deep">Welcome back</p>
          <h1 className="mt-3 text-[clamp(2.5rem,6.5vw,5.5rem)] font-extrabold leading-[0.92] tracking-[-0.03em] [font-variation-settings:'wdth'_125] sm:mt-4">
            Sign <span className="serif-italic font-normal text-red-deep">in.</span>
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Sign in to browse the fleet, manage your bookings and pick up where you left off.
          </p>
        </div>

        <div className="ticks border border-hairline bg-card p-6 sm:p-10">
          <div className="border-b border-hairline pb-4">
            <p className="mono-label text-ink">Sign in to your account</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="mt-8 space-y-6" noValidate>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={loginData.email}
              error={loginErrors.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={loginData.password}
              error={loginErrors.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            />

            {signInMutation.isError && (
              <p role="alert" className={alertClass}>
                <span className="mono font-bold">!</span>
                {isApiError(signInMutation.error) ? signInMutation.error.message : 'Invalid email or password.'}
              </p>
            )}

            <Button type="submit" arrow className="min-h-12 w-full" disabled={signInMutation.isPending}>
              {signInMutation.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 border-t border-hairline pt-6 text-center text-sm text-muted-foreground">
            Not a customer?{' '}
            <Link
              to="/signup"
              state={location.state}
              className="font-medium text-red-deep underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
