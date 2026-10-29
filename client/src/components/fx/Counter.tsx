import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const fmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function Digit({ d }: { d: number }) {
  return (
    <span className="relative inline-block h-[1em] w-[1ch] overflow-hidden align-bottom leading-none">
      <span
        className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-[800ms] ease-odo"
        style={{ transform: `translateY(${-d}em)` }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="block h-[1em] text-center leading-none">{i}</span>
        ))}
      </span>
    </span>
  )
}

/** Odometer: digits roll on first view and whenever the value changes. en-IN grouping. */
export function Counter({ value, prefix, suffix, className }: { value: number; prefix?: string; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(reduced() ? value : 0)

  useEffect(() => {
    if (reduced()) { setShown(value); return }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(value); io.disconnect() }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [value])

  const chars = fmt.format(Math.round(shown)).split('')
  return (
    <span ref={ref} className={cn('mono inline-flex items-end tabular-nums', className)} aria-label={`${prefix ?? ''}${fmt.format(value)}${suffix ?? ''}`}>
      <span aria-hidden className="inline-flex items-end">
        {prefix}
        {chars.map((c, i) => (/\d/.test(c) ? <Digit key={chars.length - i} d={+c} /> : <span key={i}>{c}</span>))}
        {suffix}
      </span>
    </span>
  )
}

