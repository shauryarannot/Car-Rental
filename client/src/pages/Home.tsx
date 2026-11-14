import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import type { Category, DiscountCoupon, Vehicle } from '@/api'
import { vehicleToCar } from '@/api/http'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { CarCard, CarCardSkeleton } from '@/components/car/CarCard'
import { PickupLocation } from '@/components/car/PickupLocation'
import { useCars, useCategories, useCoupons } from '@/hooks/queries'
import { DURATION_DAYS, MAX_DAYS, returnDateFor, daysUntil, clampDays, prettyDate } from '@/lib/trip'
import { cn } from '@/lib/utils'

const ease = [0.22, 1, 0.36, 1] as const

const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, name: 'Hatchback', discountPercent: 10 },
  { id: 2, name: 'Sedan', discountPercent: 5 },
  { id: 3, name: 'Compact SUV', discountPercent: 8 },
  { id: 4, name: 'SUV', discountPercent: 0 },
  { id: 5, name: 'MUV', discountPercent: 12 },
  { id: 6, name: 'Luxury', discountPercent: 0 },
  { id: 7, name: 'Electric', discountPercent: 15 },
  { id: 8, name: 'Convertible', discountPercent: 0 },
]

const FALLBACK_VEHICLES: Vehicle[] = [
  { id: 1, name: 'BMW Z4', dailyRate: 19000, available: true, category: FALLBACK_CATEGORIES[7] },
  { id: 2, name: 'BMW X5', dailyRate: 18000, available: true, category: FALLBACK_CATEGORIES[5] },
  { id: 3, name: 'Lexus ES', dailyRate: 16000, available: true, category: FALLBACK_CATEGORIES[5] },
  { id: 4, name: 'Jaguar XF', dailyRate: 15000, available: true, category: FALLBACK_CATEGORIES[5] },
  { id: 5, name: 'Mercedes E-Class', dailyRate: 14500, available: true, category: FALLBACK_CATEGORIES[5] },
  { id: 6, name: 'Audi A6', dailyRate: 14000, available: true, category: FALLBACK_CATEGORIES[5] },
]

const FALLBACK_GENERAL_COUPONS: DiscountCoupon[] = [
  { id: 1, code: 'WELCOME50', couponType: 'FIRST_RENTAL', discountPercent: 50 },
  { id: 2, code: 'WEEKEND10', couponType: 'DURATION', discountPercent: 10, minDays: 1, maxDays: 3 },
  { id: 3, code: 'WEEKLONG15', couponType: 'DURATION', discountPercent: 15, minDays: 5, maxDays: 9 },
  { id: 4, code: 'FORTNIGHT20', couponType: 'DURATION', discountPercent: 20, minDays: 10, maxDays: 16 },
  { id: 5, code: 'LONGHAUL25', couponType: 'DURATION', discountPercent: 25, minDays: 17, maxDays: 30 },
]

function SearchBar() {
  const navigate = useNavigate()
  const { data: cats } = useCategories()
  const categoryList = cats ?? FALLBACK_CATEGORIES
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
      <div className="flex flex-col justify-center border-b border-hairline px-4 py-3 sm:border-r sm:px-5 lg:border-b-0">
        <span className="mono-label text-muted-foreground">Pick-up</span>
        <span className="mt-1 font-medium text-ink">Today · {prettyDate(returnDateFor(0))}</span>
      </div>

      <label className="flex flex-col justify-center border-b border-hairline px-4 py-3 sm:px-5 lg:border-b-0 lg:border-r">
        <span className="mono-label text-muted-foreground">Duration</span>
        <select
          value={days}
          onChange={(e) => setDays(clampDays(Number(e.target.value)))}
          className="mt-1 w-full cursor-pointer bg-card font-medium text-ink outline-none"
        >
          {DURATION_DAYS.map((d) => (
            <option key={d} value={d} className="bg-card text-ink">
              {d} {d === 1 ? 'day' : 'days'} ({prettyDate(returnDateFor(d))})
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col justify-center border-b border-hairline px-4 py-3 sm:border-r sm:px-5 lg:border-b-0">
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

      <label className="flex flex-col justify-center border-b border-hairline px-4 py-3 sm:px-5 lg:border-b-0 lg:border-r">
        <span className="mono-label text-muted-foreground">Category</span>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="mt-1 w-full cursor-pointer bg-card font-medium text-ink outline-none"
        >
          <option value="" className="bg-card text-ink">All categories</option>
          {categoryList.map((c) => (
            <option key={c.id} value={String(c.id)} className="bg-card text-ink">
              {c.name} {Number(c.discountPercent) > 0 ? `(${Number(c.discountPercent)}% off)` : ''}
            </option>
          ))}
        </select>
      </label>

      <Button type="submit" arrow className="min-h-14 sm:col-span-2 sm:min-h-16 lg:col-span-1">
        Find cars
      </Button>
    </form>
  )
}

export default function Home() {
  const cars = useCars()
  const cats = useCategories()
  const coupons = useCoupons()

  const available = useMemo(() => cars.data?.filter((c) => c.available) ?? [], [cars.data])
  const featured = useMemo(
    () =>
      cars.data
        ? [...available].sort((a, b) => Number(!!b.imageUrl) - Number(!!a.imageUrl) || b.pricePerDay - a.pricePerDay).slice(0, 6)
        : FALLBACK_VEHICLES.map(vehicleToCar),
    [available, cars.data],
  )
  const categoryList = cats.data ?? FALLBACK_CATEGORIES
  const employeeCoupons = useMemo(
    () => coupons.data?.filter((c) => c.couponType === 'EMPLOYEE') ?? [],
    [coupons.data],
  )
  const generalCoupons = useMemo(
    () => (coupons.data ? coupons.data.filter((c) => c.couponType !== 'EMPLOYEE') : FALLBACK_GENERAL_COUPONS),
    [coupons.data],
  )

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden text-white">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        >
          <source src="/videos/car_video.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 -z-10 bg-black/40" />

        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 pb-10 pt-12 sm:gap-10 sm:px-6 sm:pb-12 sm:pt-16 lg:grid-cols-12 lg:pt-24">
          <div className="lg:col-span-7">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="mono-label"
            >
              {cars.data ? `${available.length} cars available today` : 'Fleet ready · 8 categories across India'}
            </motion.p>

            <h1 className="mt-4 text-[clamp(2.6rem,9vw,8.5rem)] font-extrabold leading-[0.9] tracking-[-0.04em] [font-variation-settings:'wdth'_125] sm:mt-6">
              {['Pick a car.', 'Pick your', 'Go.'].map((line, i) => (
                <motion.span
                  key={line}
                  className="block"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease, delay: 0.1 + i * 0.08 }}
                >
                  {line}
                  {i === 1 && (
                    <span className="serif-italic font-normal text-[var(--odo-red-tint)]">
                      {' '}days.
                    </span>
                  )}
                </motion.span>
              ))}
            </h1>
          </div>

          <motion.div
            className="lg:col-span-12"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.5 }}
          >
            <SearchBar />
          </motion.div>
        </div>
      </section>

      {/* Motherson Employee Benefits Promotional Banner */}
      <section aria-labelledby="motherson-benefits-heading" className="mx-auto max-w-[1440px] px-4 pt-12 sm:px-6 sm:pt-16">
        <div className="ticks relative overflow-hidden border border-hairline bg-card p-5 sm:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6 xl:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono-label border border-red-deep/40 bg-[var(--odo-red-tint)] px-2.5 py-1 text-red-deep">
                  Motherson Corporate Perks
                </span>
                <span className="mono-label border border-hairline bg-background px-2.5 py-1 text-ink">
                  Multi-Use · Reusable Benefit
                </span>
              </div>

              <h2
                id="motherson-benefits-heading"
                className="mt-4 text-[clamp(1.75rem,4vw,3.25rem)] font-extrabold leading-[0.98] tracking-[-0.03em]"
              >
                Exclusive Benefits for{' '}
                <span className="serif-italic font-normal text-red-deep">Motherson Employees</span>
              </h2>

              <p className="mt-3 max-w-2xl text-base italic text-muted-foreground sm:text-lg">
                Enjoy special discounts on your car rentals. Your employee benefits can be used across multiple bookings!
              </p>

              <ul className="mt-6 flex flex-wrap gap-2.5 text-xs sm:gap-3 sm:text-sm">
                {[
                  'Reusable on every booking',
                  'No minimum or maximum trip-day limits',
                  'Valid across all vehicle categories',
                ].map((perk) => (
                  <li
                    key={perk}
                    className="flex items-center gap-2 border border-hairline bg-background px-3 py-1.5 font-medium text-ink"
                  >
                    <span aria-hidden className="size-1.5 shrink-0 bg-red-deep" />
                    {perk}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Button asChild arrow className="w-full sm:w-auto">
                  <Link to="/fleet">Explore Fleet & Redeem</Link>
                </Button>
                <span className="mono-label text-muted-foreground">
                  Select “Coupon code” at checkout to apply your employee pass
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-6 xl:col-span-5">
              {(employeeCoupons.length > 0
                ? employeeCoupons
                : [
                    { id: -1, code: 'MOTHERSON20', couponType: 'EMPLOYEE' as const, discountPercent: 20 },
                    { id: -2, code: 'STAFF30', couponType: 'EMPLOYEE' as const, discountPercent: 30 },
                  ]
              ).map((c) => (
                <div
                  key={c.code}
                  className="ticks flex flex-col justify-between border border-dashed border-red-deep/50 bg-background p-5 transition-colors duration-200 hover:border-red-deep"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="mono-label text-red-deep">Employee Pass</span>
                      <span className="mono-label border border-red-deep/30 bg-[var(--odo-red-tint)] px-2 py-0.5 text-[10px] text-red-deep">
                        Multi-use
                      </span>
                    </div>
                    <p className="mono mt-4 text-4xl font-semibold text-red-deep sm:text-5xl">
                      {Number(c.discountPercent)}% <span className="text-lg font-normal">OFF</span>
                    </p>
                  </div>

                  <div className="mt-6 border-t border-hairline pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="mono-label text-muted-foreground">Code</span>
                      <span className="mono border border-hairline bg-card px-2 py-0.5 text-sm font-semibold text-ink">
                        {c.code}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Exclusive Motherson employee rate · Reusable across multiple bookings.
                    </p>
                    <Link
                      to="/fleet"
                      className="mono-label mt-3 inline-block text-red-deep underline-offset-4 hover:underline"
                    >
                      Book with {c.code} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-[1440px] px-4 pt-16 sm:px-6 sm:pt-24">
        <SectionHeader n={2} label="Browse by type" />
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-4 xl:grid-cols-8">
          {categoryList.map((c) => {
            const n = available.filter((x) => x.category.id === c.id).length
            const pct = Number(c.discountPercent) || 0
            return (
              <li key={c.id} className="flex">
                <Link
                  to={`/fleet?category=${c.id}`}
                  className="group flex h-full w-full flex-col justify-between gap-4 border border-hairline bg-card p-4 transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-paper sm:gap-5 sm:p-5"
                >
                  <span className="mono-label opacity-70">{cars.data ? `${n} available` : 'Explore'}</span>
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
      <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader n={3} label="Ready to go" className="min-w-48 flex-1" />
          <Link to="/fleet" className="text-sm font-medium text-red-deep hover:underline">See the fleet →</Link>
        </div>
        <div className="mt-6 grid items-stretch gap-5 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {cars.isLoading && Array.from({ length: 6 }, (_, i) => <CarCardSkeleton key={i} />)}
          {featured.map((c, i) => <CarCard key={c.id} car={c} index={i} />)}
        </div>
        {cars.isError && (
          <div role="alert" className="mt-8 border border-hairline p-6 sm:p-8">
            <p className="serif-italic text-3xl sm:text-4xl">The garage is closed.</p>
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
            <li
              key={t}
              className={cn(
                'flex h-full flex-col justify-between border-hairline p-6 sm:p-8',
                i < 3 && 'border-b sm:border-b-0',
                i < 2 && 'sm:border-b lg:border-b-0',
                i % 2 === 0 && 'sm:border-r',
                i === 1 && 'lg:border-r',
              )}
            >
              <span className="mono text-5xl font-light text-steel sm:text-6xl">0{i + 1}</span>
              <div className="mt-5 sm:mt-6">
                <p className="text-xl font-semibold">{t}</p>
                <p className="mt-1 text-muted-foreground">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pt-16 sm:px-6 sm:pt-24">
        <SectionHeader n={4} label="Where to find us" />
        <div className="mt-6 sm:mt-8">
          <PickupLocation />
        </div>
      </section>

      {/* Offers */}
      {generalCoupons.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 sm:py-24">
          <SectionHeader n={5} label="Offers" />
          <ul className="mt-6 grid items-stretch gap-4 sm:mt-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {generalCoupons.map((c) => (
              <li key={c.id} className="ticks flex h-full flex-col justify-between border border-dashed border-hairline bg-card p-5 sm:p-6">
                <p className="mono text-4xl font-medium text-red-deep">{Number(c.discountPercent)}%</p>
                <div className="mt-6">
                  <p className="mono-label">{c.code}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {c.couponType === 'FIRST_RENTAL' && 'Your first rental.'}
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
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-4 py-16 sm:flex-row sm:items-end sm:gap-8 sm:px-6 sm:py-24">
          <p className="serif-italic text-[clamp(3.5rem,12vw,10rem)] leading-none">Where to?</p>
          <Button asChild className="w-full bg-white text-red-deep hover:bg-[var(--odo-red-tint)] sm:w-auto"><Link to="/fleet">See the fleet →</Link></Button>
        </div>
      </section>
    </>
  )
}
