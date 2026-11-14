import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const fmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

function Digit({ d }: { d: number }) {
  return (
    <span className="relative inline-flex h-[1em] w-[1ch] overflow-hidden leading-none">
      <span
        className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-[800ms] ease-odo"
        style={{ transform: `translateY(${-d}em)` }}
      >
        {DIGITS.map((i) => (
          <span key={i} className="flex h-[1em] items-center justify-center leading-none">
            {i}
          </span>
        ))}
      </span>
    </span>
  )
}

/** Odometer: digits roll on first view and whenever the value changes. en-IN grouping. */
export function Counter({ value, prefix, suffix, className }: { value: number; prefix?: string; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(() => (reduced() ? value : 0))

  useEffect(() => {
    if (reduced()) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setShown(value)
        io.disconnect()
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [value])

  const displayValue = reduced() ? value : shown
  const chars = fmt.format(Math.round(displayValue)).split('')
  return (
    <span
      ref={ref}
      className={cn('mono inline-flex items-center tabular-nums leading-none', className)}
      aria-label={`${prefix ?? ''}${fmt.format(value)}${suffix ?? ''}`}
    >
      <span aria-hidden className="inline-flex items-center leading-none">
        {prefix && <span className="inline-flex h-[1em] items-center whitespace-pre leading-none">{prefix}</span>}
        {chars.map((c, i) =>
          /\d/.test(c) ? (
            <Digit key={chars.length - i} d={+c} />
          ) : (
            <span key={i} className="inline-flex h-[1em] items-center leading-none">
              {c}
            </span>
          ),
        )}
        {suffix && <span className="inline-flex h-[1em] items-center whitespace-pre leading-none">{suffix}</span>}
      </span>
    </span>
  )
}
