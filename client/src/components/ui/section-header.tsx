import { cn } from '@/lib/utils'

/** "02 — FLEET" followed by a hairline that fills the row. */
export function SectionHeader({ n, label, className }: { n: number; label: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <span className="mono-label whitespace-nowrap text-muted-foreground">
        {String(n).padStart(2, '0')} — {label}
      </span>
      <span aria-hidden className="h-px flex-1 bg-hairline" />
    </div>
  )
}

