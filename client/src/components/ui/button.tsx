import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactElement } from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const baseClass =
  'group relative inline-flex min-h-11 items-center justify-center gap-3 overflow-hidden px-6 text-sm font-medium tracking-wide transition-colors duration-200 ease-odo disabled:pointer-events-none disabled:opacity-40'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-red-deep',
  secondary:
    'border border-ink text-ink before:absolute before:inset-0 before:translate-y-full before:bg-ink before:transition-transform before:duration-200 before:ease-odo hover:text-paper hover:before:translate-y-0',
  ghost: 'text-ink hover:bg-surface-alt',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  asChild?: boolean
  arrow?: boolean
}

/** Square, no shadow. Primary = Signal fill. Secondary = hairline outline with a bottom-up wipe. */
export function Button({ className, variant = 'primary', asChild, arrow, children, ...props }: ButtonProps) {
  const classes = cn(baseClass, variants[variant], className)

  if (asChild && isValidElement<{ className?: string }>(children)) {
    return cloneElement(children as ReactElement<{ className?: string }>, {
      ...props,
      className: cn(classes, children.props.className),
    })
  }

  return (
    <button className={classes} {...props}>
      <span className="relative z-10">{children}</span>
      {arrow && (
        <span aria-hidden className="relative z-10 transition-transform duration-200 ease-odo group-hover:translate-x-1">
          →
        </span>
      )}
    </button>
  )
}

