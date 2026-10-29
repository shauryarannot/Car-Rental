import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Square, no shadow. Primary = Signal fill. Secondary = hairline outline with a bottom-up wipe. */
const button = cva(
  'group relative inline-flex min-h-11 items-center justify-center gap-3 overflow-hidden px-6 text-sm font-medium tracking-wide transition-colors duration-200 ease-odo disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-red-deep',
        secondary:
          'border border-ink text-ink before:absolute before:inset-0 before:translate-y-full before:bg-ink before:transition-transform before:duration-200 before:ease-odo hover:text-paper hover:before:translate-y-0',
        ghost: 'text-ink hover:bg-surface-alt',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {
  asChild?: boolean
  arrow?: boolean
}

export function Button({ className, variant, asChild, arrow, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp className={cn(button({ variant }), className)} {...props}>
      {asChild ? (
        children
      ) : (
        <>
          <span className="relative z-10">{children}</span>
          {arrow && (
            <span aria-hidden className="relative z-10 transition-transform duration-200 ease-odo group-hover:translate-x-1">
              →
            </span>
          )}
        </>
      )}
    </Comp>
  )
}

