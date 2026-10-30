import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { CarCard, CarCardSkeleton } from '@/components/car/CarCard'
import { CarImage } from '@/components/car/CarImage'
import { useCars, useCategories, useCoupons } from '@/hooks/queries'
import { MAX_DAYS, returnDateFor, daysUntil, clampDays, prettyDate } from '@/lib/trip'
import { cn, formatINR } from '@/lib/utils'

const ease = [0.22, 1, 0.36, 1] as const

function SearchBar() {
  const navigate = useNavigate()
  const { data: cats } = useCategories()
  const [days, setDays] = useState(2)
  const [cat, setCat] = useState('')
  const ret = returnDateFor(days)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const q = new URLSearchParams({ days: String(days) })
        if (cat) q.set('category', cat)
        navigate(`/fleet?${q}`)
      }}
      className="grid w-full grid-cols-1 border border-hairline bg-card text-ink sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
    >
      <div className="flex flex-col justify-center border-b border-hairline px-5 py-3 lg:border-b-0 lg:border-r">
        <span className="mono-label text-muted-foreground">Pick-up</span>
        <span className="mt-1 font-medium text-ink">Today · {prettyDate(returnDateFor(0))}</span>
      </div>

      <label className="flex flex-col justify-center border-b border-hairline px-5 py-3 lg:border-b-0 lg:border-r">
        <span className="mono-label text-muted-foreground">Duration</span>
        <select
          value={days}
          onChange={(e) => setDays(clampDays(Number(e.target.value)))}
          className="mt-1 w-full cursor-pointer bg-card font-medium text-ink outline-none"
        >
          {Array.from({ length: MAX_DAYS }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d} className="bg-card text-ink">
              {d} {d === 1 ? 'day' : 'days'} ({prettyDate(returnDateFor(d))})
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col justify-center border-b border-hairline px-5 py-3 sm:border-b-0 lg:border-r">
        <span className="mono-label text-muted-foreground">Return date</span>
        <input
          type="date"
          value={ret}
          min={returnDateFor(1)}
          max={returnDateFor(MAX_DAYS)}
          onChange={(e) => e.target.value && setDays(clampDays(daysUntil(e.target.value)))}
          className="mt-1 w-full cursor-pointer bg-card font-medium text-ink outline-none"
        />
      </label>

      <label className="flex flex-col justify-center border-b border-hairline px-5 py-3 sm:border-b-0 lg:border-r">
        <span className="mono-label text-muted-foreground">Category</span>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="mt-1 w-full cursor-pointer bg-card font-medium text-ink outline-none"
        >
          <option value="" className="bg-card text-ink">All categories</option>
          {cats?.map((c) => (
            <option key={c.id} value={String(c.id)} className="bg-card text-ink">
              {c.name} {Number(c.discountPercent) > 0 ? `(${Number(c.discountPercent)}% off)` : ''}
            </option>
          ))}
        </select>
      </label>

      <Button type="submit" arrow className="min-h-16 sm:col-span-2 lg:col-span-1">
        Find cars
      </Button>
    </form>
  )
}

export default function Home() {
  const cars = useCars()
  const cats = useCategories()
  const coupons = useCoupons()
  const available = cars.data?.filter((c) => c.available) ?? []
  const featured = [...available].sort((a, b) => Number(!!b.imageUrl) - Number(!!a.imageUrl) || b.pricePerDay - a.pricePerDay).slice(0, 6)
  const hero = available.find((c) => c.imageUrl && /suv/i.test(c.category.name)) ?? available.find((c) => c.imageUrl)

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[var(--odo-red-bright)] to-[var(--odo-signal)] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-6 pb-12 pt-16 lg:grid-cols-12 lg:pt-24">
          <div className="lg:col-span-7">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="mono-label">
              FIG. 01 — {cars.data ? `${available.length} cars available today` : 'counting the lot'}
            </motion.p>
            <h1 className="mt-6 text-[clamp(3rem,9vw,8.5rem)] font-extrabold leading-[0.9] tracking-[-0.04em] [font-variation-settings:'wdth'_125]">
              {['Pick a car.', 'Pick your', 'Go.'].map((line, i) => (
                <motion.span key={line} className="block" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.1 + i * 0.08 }}>
                  {line}
                  {i === 1 && <span className="serif-italic font-normal text-[var(--odo-red-tint)]"> days.</span>}
                </motion.span>
              ))}
            </h1>
          </div>
          <motion.div
            className="relative hidden lg:col-span-5 lg:block"
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.35 }}
          >
            {hero && (
              <figure className="absolute inset-0 border border-white/30">
                <CarImage src={hero.imageUrl} alt={hero.name} category={hero.category.name} eager className="h-full" />
                <figcaption className="mono-label absolute bottom-0 left-0 bg-ink px-3 py-2 text-paper">
                  {hero.name} · {formatINR(hero.pricePerDay)} / day
                </figcaption>
              </figure>
            )}
          </motion.div>
          <motion.div className="lg:col-span-12" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.5 }}>
            <SearchBar />
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-[1440px] px-6 pt-24">
        <SectionHeader n={2} label="Browse by type" />
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {cats.data?.map((c) => {
            const n = cars.data?.filter((x) => x.category.id === c.id && x.available).length ?? 0
            const pct = Number(c.discountPercent) || 0
            return (
              <li key={c.id} className="flex">
                <Link
                  to={`/fleet?category=${c.id}`}
                  className="group flex h-full w-full flex-col justify-between gap-5 border border-hairline bg-card p-5 transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-paper"
                >
                  <span className="mono-label opacity-70">{n} available</span>
                  <span className="display-condensed truncate text-2xl leading-tight" title={c.name}>
                    {c.name}
                  </span>
                  <span className={cn('mono-label', pct > 0 ? 'text-red-deep group-hover:text-[var(--odo-red-tint)]' : 'opacity-50')}>
                    {pct > 0 ? `${pct}% off` : 'Standard'}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-[1440px] px-6 py-24">
        <div className="flex items-end justify-between gap-6">
          <SectionHeader n={3} label="Ready to go" className="flex-1" />
          <Link to="/fleet" className="text-sm font-medium text-red-deep hover:underline">See the fleet →</Link>
        </div>
        <div className="mt-8 grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cars.isLoading && Array.from({ length: 6 }, (_, i) => <CarCardSkeleton key={i} />)}
          {featured.map((c, i) => <CarCard key={c.id} car={c} index={i} />)}
        </div>
        {cars.isError && (
          <div role="alert" className="mt-8 border border-hairline p-8">
            <p className="serif-italic text-4xl">The garage is closed.</p>
            <p className="mt-2 text-muted-foreground">We couldn't reach the server. Try again.</p>
            <Button variant="secondary" className="mt-6" onClick={() => cars.refetch()}>Retry</Button>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-y border-hairline bg-card">
        <ol className="mx-auto grid max-w-[1440px] items-stretch sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Choose', 'Pick a car from the lot.'],
            ['Days', 'Up to 30 days, starting today.'],
            ['Confirm', 'Add your details and a coupon if you have one.'],
            ['Collect', 'Show your ticket at pick-up.'],
          ].map(([t, d], i) => (
            <li key={t} className="flex h-full flex-col justify-between border-hairline p-8 sm:[&:not(:last-child)]:border-r">
              <span className="mono text-6xl font-light text-steel">0{i + 1}</span>
              <div className="mt-6">
                <p className="text-xl font-semibold">{t}</p>
                <p className="mt-1 text-muted-foreground">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Offers */}
      {coupons.data && coupons.data.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-6 py-24">
          <SectionHeader n={4} label="Offers" />
          <ul className="mt-8 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {coupons.data.slice(0, 4).map((c) => (
              <li key={c.id} className="ticks flex h-full flex-col justify-between border border-dashed border-hairline bg-card p-6">
                <p className="mono text-4xl font-medium text-red-deep">{Number(c.discountPercent)}%</p>
                <div className="mt-6">
                  <p className="mono-label">{c.code}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {c.couponType === 'FIRST_RENTAL' && 'Your first rental.'}
                    {c.couponType === 'EMPLOYEE' && 'Motherson employees.'}
                    {c.couponType === 'DURATION' && `Trips of ${c.minDays}–${c.maxDays} days.`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Closing */}
      <section className="bg-[var(--odo-signal)] text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-8 px-6 py-24 sm:flex-row sm:items-end">
          <p className="serif-italic text-[clamp(4rem,12vw,10rem)] leading-none">Where to?</p>
          <Button asChild className="bg-white text-red-deep hover:bg-[var(--odo-red-tint)]"><Link to="/fleet">See the fleet →</Link></Button>
        </div>
      </section>
    </>
  )
}
