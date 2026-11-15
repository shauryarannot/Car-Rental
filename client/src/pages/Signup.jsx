import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, isApiError } from '@/api'
import { useAuth } from '@/app/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { normalizeEmail, validateEmail } from '@/lib/utils'

const alertClass = 'flex items-center gap-2 border border-red-deep/40 bg-[var(--odo-red-tint)] px-3 py-2 text-sm text-red-deep'

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from

  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    employeeId: '',
  })
  const [regErrors, setRegErrors] = useState({})

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const normalizedEmail = normalizeEmail(data.email)
      await api.register({
        name: data.name.trim(),
        email: normalizedEmail,
        password: data.password,
        phone: data.phone.trim() || undefined,
        employeeId: data.employeeId.trim() || undefined,
      })
      return api.login({ email: normalizedEmail, password: data.password })
    },
    onSuccess: (res, vars) => {
      login(res, normalizeEmail(vars.email), vars.employeeId)
      toast.success('Account created. Welcome aboard.')
      navigate(from && from !== '/login' && from !== '/signup' ? from : '/', { replace: true })
    },
    onError: (e) => {
      const msg = isApiError(e) ? e.message : 'Could not register account.'
      if (/email/i.test(msg)) {
        setRegErrors((prev) => ({ ...prev, email: msg }))
      }
      toast.error(msg)
    },
  })

  const handleRegisterSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (regData.name.trim().length < 2) errs.name = 'Enter your full name.'
    const emailErr = validateEmail(regData.email)
    if (emailErr) errs.email = emailErr
    if (!regData.password) {
      errs.password = 'Password is required.'
    } else if (regData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.'
    }
    setRegErrors(errs)
    if (!Object.keys(errs).length) {
      registerMutation.mutate({ ...regData, email: normalizeEmail(regData.email) })
    }
  }

  return (
    <div className="page-shell flex min-h-[calc(100vh-3.5rem)] items-center py-10 sm:py-16">
      <div className="grid w-full items-center gap-8 sm:gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6 xl:col-span-7">
          <p className="mono-label text-red-deep">Join Ryde.exe</p>
          <h1 className="mt-3 text-[clamp(2.5rem,6.5vw,5.5rem)] font-extrabold leading-[0.92] tracking-[-0.03em] [font-variation-settings:'wdth'_125] sm:mt-4">
            Create your <span className="serif-italic font-normal text-red-deep">account.</span>
          </h1>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Register in a minute to reserve cars, apply offers and keep track of every trip.
          </p>
        </div>

        <div className="ticks border border-hairline bg-card p-6 sm:p-10 lg:col-span-6 xl:col-span-5">
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
              onChange={(e) => {
                const nextName = e.target.value
                setRegData({ ...regData, name: nextName })
                if (regErrors.name && nextName.trim().length >= 2) {
                  setRegErrors((prev) => ({ ...prev, name: undefined }))
                }
              }}
            />
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={regData.email}
              error={regErrors.email}
              onBlur={() => {
                if (regData.email.trim()) {
                  const emailErr = validateEmail(regData.email)
                  setRegErrors((prev) => ({ ...prev, email: emailErr ?? undefined }))
                }
              }}
              onChange={(e) => {
                const nextEmail = e.target.value
                setRegData({ ...regData, email: nextEmail })
                if (regErrors.email) {
                  setRegErrors((prev) => ({ ...prev, email: validateEmail(nextEmail) ?? undefined }))
                }
              }}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={regData.password}
              error={regErrors.password}
              onChange={(e) => {
                const nextPassword = e.target.value
                setRegData({ ...regData, password: nextPassword })
                if (regErrors.password && nextPassword.length >= 6) {
                  setRegErrors((prev) => ({ ...prev, password: undefined }))
                }
              }}
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
