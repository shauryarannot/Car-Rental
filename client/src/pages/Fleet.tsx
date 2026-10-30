import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CarCard, CarCardSkeleton } from '@/components/car/CarCard'
import { Button } from '@/components/ui/button'
import { useCars, useCategories } from '@/hooks/queries'
import { MAX_DAYS, clampDays, daysUntil, prettyDate, returnDateFor } from '@/lib/trip'
import { cn, formatINR } from '@/lib/utils'

type Sort = 'relevance' | 'price-asc' | 'price-desc' | 'name'
const sorts: { v: Sort; label: string }[] = [
  { v: 'relevance', label: 'Relevance' },
  { v: 'price-asc', label: 'Price: low to high' },
  { v: 'price-desc', label: 'Price: high to low' },
  { v: 'name', label: 'Name' },
]

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-10 border px-4 text-sm font-medium transition-colors duration-200',
        active ? 'border-ink bg-ink text-paper' : 'border-hairline bg-card text-ink hover:border-ink',
      )}
    >
      {children}
    </button>
  )
}

export default function Fleet() {
  const [params, setParams] = useSearchParams()
  const cars = useCars()
  const cats = useCategories()
  const [showFilters, setShowFilters] = useState(false)

  // All filter state lives in the URL so a view can be shared.
  const days = clampDays(Number(params.get('days') ?? 1))
  const category = params.get('category') ?? ''
  const onlyAvailable = params.get('available') !== 'false'
  const maxPrice = Number(params.get('max') ?? 0)
  const sort = (params.get('sort') as Sort) ?? 'relevance'
  const q = params.get('q') ?? ''

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params)
    if (v === null || v === '') next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }

  const priceCeiling = useMemo(() => Math.max(0, ...(cars.data ?? []).map((c) => c.pricePerDay)), [cars.data])
  const list = useMemo(() => {
    let l = cars.data ?? []
    if (onlyAvailable) l = l.filter((c) => c.available)
    if (category) l = l.filter((c) => String(c.category.id) === category)
    if (maxPrice) l = l.filter((c) => c.pricePerDay <= maxPrice)
    if (q) l = l.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
    const s = [...l]
    if (sort === 'price-asc') s.sort((a, b) => a.pricePerDay - b.pricePerDay)
    if (sort === 'price-desc') s.sort((a, b) => b.pricePerDay - a.pricePerDay)
    if (sort === 'name') s.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'relevance') s.sort((a, b) => Number(b.available) - Number(a.available) || Number(!!b.imageUrl) - Number(!!a.imageUrl))
    return s
  }, [cars.data, onlyAvailable, category, maxPrice, q, sort])

  const filters = (
    <div className="space-y-8">
      <div>
        <p className="mono-label mb-3 text-muted-foreground">Category</p>
        <div className="flex flex-wrap gap-2">
          <Chip active={!category} onClick={() => set('category', null)}>All</Chip>
          {cats.data?.map((c) => (
            <Chip key={c.id} active={category === String(c.id)} onClick={() => set('category', String(c.id))}>{c.name}</Chip>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="max" className="mono-label mb-3 flex justify-between text-muted-foreground">
          <span>Max price / day</span>
          <span className="text-ink">{maxPrice ? formatINR(maxPrice) : 'Any'}</span>
        </label>
        <input
          id="max" type="range" min={1000} max={priceCeiling || 25000} step={500}
          value={maxPrice || priceCeiling || 25000}
          onChange={(e) => set('max', Number(e.target.value) >= priceCeiling ? null : e.target.value)}
          className="w-full accent-[var(--odo-signal)]"
        />
      </div>
      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
        <span className="text-sm font-medium">Show only available</span>
        <input type="checkbox" checked={onlyAvailable} onChange={(e) => set('available', e.target.checked ? null : 'false')} className="size-5 accent-[var(--odo-signal)]" />
      </label>
      <Button variant="secondary" className="w-full" onClick={() => setParams(new URLSearchParams({ days: String(days) }), { replace: true })}>
        Reset filters
      </Button>
    </div>
  )

  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-24">
      {/* Top filter bar (normal flow at the top of the page, never floating mid-screen) */}
      <div className="-mx-6 border-b border-hairline bg-card px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex flex-col border border-hairline bg-card px-3 py-1.5">
            <span className="mono-label text-muted-foreground">Duration</span>
            <select
              value={days}
              onChange={(e) => set('days', String(clampDays(Number(e.target.value))))}
              aria-label="Trip duration in days"
              className="mt-0.5 cursor-pointer bg-card text-sm font-medium text-ink outline-none"
            >
              {Array.from({ length: MAX_DAYS }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d} className="bg-card text-ink">
                  {d} {d === 1 ? 'day' : 'days'} ({prettyDate(returnDateFor(d))})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col border border-hairline bg-card px-3 py-1.5">
            <span className="mono-label text-muted-foreground">Return date</span>
            <input
              type="date"
              value={returnDateFor(days)}
              min={returnDateFor(1)}
              max={returnDateFor(MAX_DAYS)}
              onChange={(e) => e.target.value && set('days', String(clampDays(daysUntil(e.target.value))))}
              className="mt-0.5 cursor-pointer bg-card text-sm font-medium text-ink outline-none"
              aria-label={`Return date, ${prettyDate(returnDateFor(days))}`}
            />
          </label>

          <label className="flex flex-col border border-hairline bg-card px-3 py-1.5">
            <span className="mono-label text-muted-foreground">Category</span>
            <select
              value={category}
              onChange={(e) => set('category', e.target.value || null)}
              aria-label="Filter by category"
              className="mt-0.5 cursor-pointer bg-card text-sm font-medium text-ink outline-none"
            >
              <option value="" className="bg-card text-ink">All categories</option>
              {cats.data?.map((c) => (
                <option key={c.id} value={String(c.id)} className="bg-card text-ink">
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <input
            type="search"
            value={q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Search a model…"
            aria-label="Search a model"
            className="min-h-12 flex-1 border border-hairline bg-card px-3 text-sm text-ink outline-none focus:border-signal sm:max-w-xs"
          />

          <label className="flex flex-col border border-hairline bg-card px-3 py-1.5">
            <span className="mono-label text-muted-foreground">Sort by</span>
            <select
              value={sort}
              onChange={(e) => set('sort', e.target.value === 'relevance' ? null : e.target.value)}
              aria-label="Sort"
              className="mt-0.5 cursor-pointer bg-card text-sm font-medium text-ink outline-none"
            >
              {sorts.map((s) => (
                <option key={s.v} value={s.v} className="bg-card text-ink">
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="mono-label min-h-12 border border-hairline bg-card px-4 lg:hidden" onClick={() => setShowFilters(true)}>
            Filters
          </button>
        </div>
      </div>

      <h1 className="pt-12 text-[clamp(3rem,7vw,6rem)] font-extrabold leading-none tracking-[-0.03em]">
        The fleet<sup className="mono ml-2 align-super text-base font-normal text-muted-foreground">{list.length}</sup>
      </h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20">{filters}</div>
        </aside>

        <div>
          {cars.isError ? (
            <div role="alert" className="border border-hairline p-10">
              <p className="serif-italic text-5xl">The garage is closed.</p>
              <p className="mt-2 text-muted-foreground">We couldn't reach the server. Try again.</p>
              <Button variant="secondary" className="mt-6" onClick={() => cars.refetch()}>Retry</Button>
            </div>
          ) : cars.isLoading ? (
            <div className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }, (_, i) => <CarCardSkeleton key={i} />)}
            </div>
          ) : list.length === 0 ? (
            <div className="border border-hairline p-10">
              <p className="serif-italic text-5xl">Nothing on the lot.</p>
              <p className="mt-2 text-muted-foreground">No car matches these filters.</p>
              <Button variant="secondary" className="mt-6" onClick={() => setParams(new URLSearchParams({ days: String(days) }))}>Reset filters</Button>
            </div>
          ) : (
            <div className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((c, i) => (
                <CarCard key={c.id} car={c} days={days} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <AnimatePresence>
        {showFilters && (
          <motion.div className="fixed inset-0 z-[60] lg:hidden" data-lenis-prevent initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/40" onClick={() => setShowFilters(false)} />
            <motion.div
              role="dialog" aria-modal aria-label="Filters"
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto border-t border-hairline bg-background p-6"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-6 flex items-center justify-between">
                <p className="mono-label">Filters</p>
                <button type="button" className="mono-label min-h-11" onClick={() => setShowFilters(false)}>Done</button>
              </div>
              {filters}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
