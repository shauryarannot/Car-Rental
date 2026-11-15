import { cn } from '@/lib/utils'

const map = {
  available: { label: 'Available', dot: 'bg-pit' },
  reserved: { label: 'Reserved', dot: 'bg-amber' },
  out: { label: 'Out', dot: 'bg-steel' },
}

/** Mono uppercase status with a round dot (the only fully round element in the system). */
export function StatusPill({ status, className }) {
  const s = map[status]
  return (
    <span className={cn('mono-label inline-flex items-center gap-2 border border-hairline px-2 py-1', className)}>
      <span aria-hidden className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}
