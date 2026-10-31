import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { api, isApiError } from '@/api'
import { useAuth } from '@/app/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SectionHeader } from '@/components/ui/section-header'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  phone: z.string().trim().optional(),
  employeeId: z.string().trim().optional(),
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()

  const from = (location.state as { from?: string } | null)?.from

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', phone: '', employeeId: '' },
  })

  const signInMutation = useMutation({
    mutationFn: (data: LoginForm) => api.login(data),
    onSuccess: (res, vars) => {
      qc.clear()
      login(res, vars.email)
      toast.success(`Signed in as ${res.name} (${res.role})`)
      if (from && from !== '/login') {
        navigate(from, { replace: true })
      } else {
        navigate(res.role === 'ADMIN' ? '/admin' : '/', { replace: true })
      }
    },
    onError: (e) => {
      toast.error(isApiError(e) ? e.message : 'Invalid email or password.')
    },
  })

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      await api.register({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
        employeeId: data.employeeId || undefined,
      })
      return api.login({ email: data.email, password: data.password })
    },
    onSuccess: (res, vars) => {
      qc.clear()
      login(res, vars.email)
      toast.success(`Account created. Welcome, ${res.name}.`)
      navigate('/', { replace: true })
    },
    onError: (e) => {
      toast.error(isApiError(e) ? e.message : 'Could not register account.')
    },
  })

  const quickLogin = (email: string, password: string) => {
    setMode('login')
    loginForm.setValue('email', email, { shouldValidate: true })
    loginForm.setValue('password', password, { shouldValidate: true })
    signInMutation.mutate({ email, password })
  }

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-16 lg:py-24">
      <div className="grid gap-16 lg:grid-cols-12">
        {/* Left: Editorial headline + Role privilege matrix */}
        <div className="flex flex-col justify-between lg:col-span-6">
          <div>
            <p className="mono-label text-red-deep">01 — ACCESS & CREDENTIALS</p>
            <h1 className="mt-4 text-[clamp(3rem,6.5vw,5.5rem)] font-extrabold leading-[0.92] tracking-[-0.03em] [font-variation-settings:'wdth'_125]">
              Identify <span className="serif-italic font-normal text-red-deep">yourself.</span>
            </h1>
            <p className="mt-4 max-w-lg text-muted-foreground">
              The fleet, pricing, and booking instruments are protected by JWT role-based access. Sign in as a customer to reserve vehicles, or as an administrator to manage the fleet.
            </p>
          </div>

          <div className="mt-12 space-y-6">
            <SectionHeader n={2} label="Quick demo accounts (1-click sign-in)" />
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                disabled={signInMutation.isPending}
                onClick={() => quickLogin('admin@carrental.com', 'Admin@123')}
                className="ticks group flex flex-col justify-between border border-hairline bg-card p-4 text-left transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-paper"
              >
                <span className="mono-label bg-primary px-2 py-0.5 text-[10px] text-primary-foreground w-fit">ROLE · ADMIN</span>
                <div className="mt-4">
                  <p className="font-semibold">Fleet Admin</p>
                  <p className="mono mt-1 truncate text-xs opacity-70">admin@carrental.com</p>
                  <p className="mono text-[11px] opacity-55">Pass: Admin@123</p>
                </div>
              </button>

              <button
                type="button"
                disabled={signInMutation.isPending}
                onClick={() => quickLogin('customer@carrental.com', 'Customer@123')}
                className="ticks group flex flex-col justify-between border border-hairline bg-card p-4 text-left transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-paper"
              >
                <span className="mono-label border border-current/30 px-2 py-0.5 text-[10px] w-fit">ROLE · CUSTOMER</span>
                <div className="mt-4">
                  <p className="font-semibold">Aarav Sharma</p>
                  <p className="mono mt-1 truncate text-xs opacity-70">customer@carrental.com</p>
                  <p className="mono text-[11px] opacity-55">Pass: Customer@123</p>
                </div>
              </button>

              <button
                type="button"
                disabled={signInMutation.isPending}
                onClick={() => quickLogin('employee@motherson.com', 'Customer@123')}
                className="ticks group flex flex-col justify-between border border-hairline bg-card p-4 text-left transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-paper"
              >
                <span className="mono-label border border-current/30 px-2 py-0.5 text-[10px] w-fit">EMPLOYEE · MSN10000</span>
                <div className="mt-4">
                  <p className="font-semibold">Priya Nair</p>
                  <p className="mono mt-1 truncate text-xs opacity-70">employee@motherson.com</p>
                  <p className="mono text-[11px] opacity-55">Pass: Customer@123</p>
                </div>
              </button>
            </div>

            <div className="border border-hairline bg-card p-5">
              <p className="mono-label text-muted-foreground">Privilege spec sheet</p>
              <dl className="mono mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                <div className="border-l-2 border-ink pl-3">
                  <dt className="font-semibold text-ink">CUSTOMER</dt>
                  <dd className="mt-1 text-muted-foreground">Browse fleet & categories · Reserve available cars · Apply coupons & employee discounts · View & return own bookings (/api/rentals/my)</dd>
                </div>
                <div className="border-l-2 border-signal pl-3">
                  <dt className="font-semibold text-red-deep">ADMIN</dt>
                  <dd className="mt-1 text-muted-foreground">Full CRUD on Vehicles, Categories, and Coupons · Manage & deactivate Customers · Inspect & return any rental across the fleet</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Right: Auth Form Card */}
        <div className="lg:col-span-5 lg:col-start-8">
          <div className="ticks border border-hairline bg-card p-8 sm:p-10">
            <div role="tablist" className="flex border-b border-hairline">
              {(['login', 'register'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={mode === t}
                  onClick={() => setMode(t)}
                  className={cn(
                    'relative min-h-11 flex-1 text-sm font-medium',
                    mode === t ? 'text-ink' : 'text-muted-foreground',
                  )}
                >
                  {t === 'login' ? 'Sign in' : 'Create customer account'}
                  {mode === t && <motion.span layoutId="auth-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-signal" />}
                </button>
              ))}
            </div>

            {mode === 'login' ? (
              <form
                key="login-form"
                onSubmit={loginForm.handleSubmit((d) => signInMutation.mutate(d))}
                className="mt-8 space-y-6"
                noValidate
              >
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register('email')}
                />
                <Input
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  error={loginForm.formState.errors.password?.message}
                  {...loginForm.register('password')}
                />

                {signInMutation.isError && (
                  <p role="alert" className="flex items-center gap-2 border border-red-deep/40 bg-[var(--odo-red-tint)] px-3 py-2 text-sm text-red-deep">
                    <span className="mono font-bold">!</span>
                    {isApiError(signInMutation.error) ? signInMutation.error.message : 'Invalid email or password.'}
                  </p>
                )}

                <Button type="submit" arrow className="min-h-12 w-full" disabled={signInMutation.isPending}>
                  {signInMutation.isPending ? 'Verifying credentials…' : 'Sign in'}
                </Button>
              </form>
            ) : (
              <form
                key="register-form"
                onSubmit={registerForm.handleSubmit((d) => registerMutation.mutate(d))}
                className="mt-8 space-y-5"
                noValidate
              >
                <Input
                  label="Full name"
                  autoComplete="name"
                  placeholder="As on driving licence"
                  error={registerForm.formState.errors.name?.message}
                  {...registerForm.register('name')}
                />
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  error={registerForm.formState.errors.email?.message}
                  {...registerForm.register('email')}
                />
                <Input
                  label="Password (min 6 characters)"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  error={registerForm.formState.errors.password?.message}
                  {...registerForm.register('password')}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Phone (optional)"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+91 98…"
                    error={registerForm.formState.errors.phone?.message}
                    {...registerForm.register('phone')}
                  />
                  <Input
                    label="Employee ID (optional)"
                    placeholder="MSN… (for staff coupons)"
                    error={registerForm.formState.errors.employeeId?.message}
                    {...registerForm.register('employeeId')}
                  />
                </div>

                {registerMutation.isError && (
                  <p role="alert" className="flex items-center gap-2 border border-red-deep/40 bg-[var(--odo-red-tint)] px-3 py-2 text-sm text-red-deep">
                    <span className="mono font-bold">!</span>
                    {isApiError(registerMutation.error) ? registerMutation.error.message : 'Registration failed.'}
                  </p>
                )}

                <Button type="submit" arrow className="min-h-12 w-full" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? 'Creating account…' : 'Register & sign in'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

