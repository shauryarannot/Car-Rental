import { useId, useState } from 'react'
import { cn } from '@/lib/utils'

/** Underline-only field with a mono label. Errors are plain language with an icon glyph, never colour alone. */
export function Input({ label, error, className, id, type, ...props }) {
  const auto = useId()
  const fid = id ?? auto
  const isPassword = type === 'password'
  const [showPassword, setShowPassword] = useState(false)
  const resolvedType = isPassword && showPassword ? 'text' : type

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={fid} className="mono-label text-muted-foreground">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={fid}
          type={resolvedType}
          aria-invalid={!!error}
          aria-describedby={error ? `${fid}-err` : undefined}
          className={cn(
            'min-h-11 w-full rounded-input border-0 border-b border-hairline bg-transparent px-0 text-base text-ink outline-none transition-colors duration-200 placeholder:text-steel focus:border-signal focus-visible:outline-none aria-[invalid=true]:border-red-deep',
            isPassword && 'pr-10',
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            title={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal"
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4.5"
                aria-hidden="true"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4.5"
                aria-hidden="true"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={`${fid}-err`} role="alert" className="flex items-center gap-1.5 text-sm text-red-deep">
          <span aria-hidden className="mono">!</span>
          {error}
        </p>
      )}
    </div>
  )
}
