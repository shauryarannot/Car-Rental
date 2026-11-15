import { cn } from '@/lib/utils'

export function Skeleton({ className, ...p }) {
  return <div aria-hidden className={cn('skeleton', className)} {...p} />
}
