import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { api, isApiError } from '@/api'
import { useAuth } from '@/app/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const alertClass = 'flex items-center gap-2 border border-red-deep/40 bg-[var(--odo-red-tint)] px-3 py-2 text-sm text-red-deep'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
      login(res, vars.email)
      toast.success('Signed in successfully.')
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
      login(res, vars.email, vars.employeeId)
      toast.success('Account created. Welcome aboard.')
      navigate('/', { replace: true })
    },
    onError: (e) => {
      toast.error(isApiError(e) ? e.message : 'Could not register account.')
    },
  })

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[1440px] items-center px-6 py-16">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="mono-label text-red-deep">{mode === 'login' ? 'Welcome back' : 'Join Ryde.exe'}</p>
          <h1 className="mt-4 text-[clamp(3rem,6.5vw,5.5rem)] font-extrabold leading-[0.92] tracking-[-0.03em] [font-variation-settings:'wdth'_125]">
            {mode === 'login' ? (
              <>Sign <span className="serif-italic font-normal text-red-deep">in.</span></>
            ) : (
              <>Create your <span className="serif-italic font-normal text-red-deep">account.</span></>
            )}
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            {mode === 'login'
              ? 'Sign in to browse the fleet, manage your bookings and pick up where you left off.'
              : 'Register in a minute to reserve cars, apply offers and keep track of every trip.'}
          </p>
        </div>

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
                {t === 'login' ? 'Sign in' : 'Sign up'}
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
                <p role="alert" className={alertClass}>
                  <span className="mono font-bold">!</span>
                  {isApiError(signInMutation.error) ? signInMutation.error.message : 'Invalid email or password.'}
                </p>
              )}

              <Button type="submit" arrow className="min-h-12 w-full" disabled={signInMutation.isPending}>
                {signInMutation.isPending ? 'Signing in…' : 'Sign in'}
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
                placeholder="Your full name"
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
                label="Password"
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
                  placeholder="For staff offers"
                  error={registerForm.formState.errors.employeeId?.message}
                  {...registerForm.register('employeeId')}
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
          )}
        </div>
      </div>
    </div>
  )
}
