import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

/** Underline-only field with a mono label. Errors are plain language with an icon glyph, never colour alone. */
export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, id, ...props }, ref) => {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={fid} className="mono-label text-muted-foreground">
        {label}
      </label>
      <input
        ref={ref}
        id={fid}
        aria-invalid={!!error}
        aria-describedby={error ? `${fid}-err` : undefined}
        className="min-h-11 rounded-input border-0 border-b border-hairline bg-transparent px-0 text-base text-ink outline-none transition-colors duration-200 placeholder:text-steel focus:border-signal focus-visible:outline-none aria-[invalid=true]:border-red-deep"
        {...props}
      />
      {error && (
        <p id={`${fid}-err`} role="alert" className="flex items-center gap-1.5 text-sm text-red-deep">
          <span aria-hidden className="mono">!</span>
          {error}
        </p>
      )}
    </div>
  )
})
Input.displayName = 'Input'

