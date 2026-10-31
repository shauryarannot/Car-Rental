import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { api, isApiError, type BenefitType, type DiscountCoupon } from '@/api'
import { useAuth } from '@/app/auth'
import { useCar, useCars, useCategories, useCoupons } from '@/hooks/queries'
import { CarImage } from '@/components/car/CarImage'
import { CarCard } from '@/components/car/CarCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusPill } from '@/components/ui/status-pill'
import { Counter } from '@/components/fx/Counter'
import { MAX_DAYS, clampDays, daysUntil, prettyDate, returnDateFor, today } from '@/lib/trip'
import { cn, formatINR } from '@/lib/utils'

function couponDescription(c: DiscountCoupon) {
  if (c.couponType === 'FIRST_RENTAL') return `${Number(c.discountPercent)}% off — First rental only`
  if (c.couponType === 'EMPLOYEE') return `${Number(c.discountPercent)}% off — Motherson employee`
  return `${Number(c.discountPercent)}% off — Trips of ${c.minDays} to ${c.maxDays} days`
}

export default function CarDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user, isAdmin, isCustomer } = useAuth()
  const car = useCar(Number(id))
  const all = useCars()
  const categories = useCategories()
  const coupons = useCoupons()

  const [days, setDays] = useState(clampDays(Number(params.get('days') ?? 2)))
  const [benefit, setBenefit] = useState<BenefitType>('NONE')
  const [couponCode, setCouponCode] = useState('')

  // Admin inline vehicle editor state
  const [editName, setEditName] = useState('')
  const [editRate, setEditRate] = useState(0)
  const [editCatId, setEditCatId] = useState(1)
  const [editAvail, setEditAvail] = useState(true)

  useEffect(() => {
    if (car.data) {
      setEditName(car.data.name)
      setEditRate(car.data.pricePerDay)
      setEditCatId(car.data.category.id)
      setEditAvail(car.data.available)
    }
  }, [car.data])

  const book = useMutation({
    mutationFn: () =>
      api.createBooking({
        vehicleId: Number(id),
        startDate: today(),
        endDate: returnDateFor(days),
        benefit,
        couponCode: benefit === 'COUPON' ? couponCode.trim().toUpperCase() : undefined,
      }),
    onSuccess: (rental) => {
      qc.invalidateQueries({ queryKey: ['cars'] })
      qc.invalidateQueries({ queryKey: ['car'] })
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
      toast.success(`Booking confirmed (${rental.vehicle.name})`)
      navigate(`/bookings/${rental.id}`)
    },
    onError: (e) => toast.error(isApiError(e) ? e.message : 'Something went wrong. Try again.'),
  })

  const adminUpdate = useMutation({
    mutationFn: () =>
      api.updateVehicle(Number(id), {
        name: editName.trim(),
        dailyRate: Number(editRate),
        available: editAvail,
        category: { id: Number(editCatId) },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cars'] })
      qc.invalidateQueries({ queryKey: ['car', Number(id)] })
      toast.success('Vehicle updated.')
    },
    onError: (e) => toast.error(isApiError(e) ? e.message : 'Could not update vehicle.'),
  })

  if (car.isLoading) {
    return (
      <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-12 lg:grid-cols-12">
        <Skeleton className="aspect-[16/10] lg:col-span-7" />
        <div className="space-y-4 lg:col-span-5"><Skeleton className="h-4 w-24" /><Skeleton className="h-16 w-3/4" /><Skeleton className="h-40" /></div>
      </div>
    )
  }
  if (car.isError || !car.data) {
    const notFound = isApiError(car.error) && car.error.status === 404
    return (
      <div className="mx-auto max-w-[1440px] px-6 py-24">
        <p className="serif-italic text-5xl">{notFound ? 'Wrong turn.' : 'The garage is closed.'}</p>
        <p className="mt-2 text-muted-foreground">{notFound ? "That car isn't in the fleet." : "We couldn't reach the server. Try again."}</p>
        <Button asChild variant="secondary" className="mt-6"><Link to="/fleet">Back to the fleet</Link></Button>
      </div>
    )
  }

  const c = car.data
  const catPct = Number(c.category.discountPercent) || 0
  const coupon = coupons.data?.find((x) => x.code.toUpperCase() === couponCode.trim().toUpperCase())
  const pct = benefit === 'CATEGORY_DISCOUNT' ? catPct : benefit === 'COUPON' && coupon ? Number(coupon.discountPercent) : 0
  const gross = c.pricePerDay * days
  const total = gross - (gross * pct) / 100
  const similar = (all.data ?? []).filter((x) => x.category.id === c.category.id && x.id !== c.id && x.available).slice(0, 3)

  const benefits: { v: BenefitType; label: string; note: string; disabled?: boolean }[] = [
    { v: 'NONE', label: 'No offer', note: 'Standard daily rate.' },
    { v: 'CATEGORY_DISCOUNT', label: `${c.category.name} discount`, note: catPct ? `${catPct}% off this category.` : 'No discount on this category.', disabled: !catPct },
    { v: 'COUPON', label: 'Coupon code', note: 'Choose a coupon from the dropdown.' },
    { v: 'FREE_UPGRADE', label: 'Free upgrade', note: 'Next car up at the same price.' },
  ]

  const selectBenefit = (next: BenefitType) => {
    setBenefit(next)
    if (next === 'COUPON' && !couponCode && coupons.data?.length) {
      setCouponCode(coupons.data[0].code)
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-24">
      <nav aria-label="Breadcrumb" className="mono-label py-6 text-muted-foreground">
        <Link to="/fleet" className="hover:text-ink">Fleet</Link> / <span>{c.category.name}</span> / <span className="text-ink">{c.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-12">
        {/* Left: image + facts */}
        <div className="lg:col-span-7">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="ticks relative border border-hairline">
            <CarImage src={c.imageUrl} alt={c.name} category={c.category.name} eager grey={!c.available} className="aspect-[16/10]" />
            {!c.available && (
              <span className="mono absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-6 border-2 border-red-deep bg-card/90 px-6 py-3 text-xl font-bold tracking-widest text-red-deep">
                OUT ON THE ROAD
              </span>
            )}
          </motion.div>
          <dl className="mt-8 grid grid-cols-2 border-y border-hairline sm:grid-cols-4">
            {[
              ['Category', c.category.name],
              ['Daily rate', formatINR(c.pricePerDay)],
              ['Max trip', `${MAX_DAYS} days`],
              ['Status', c.available ? 'Available' : 'Out'],
            ].map(([k, v], i) => (
              <div key={k} className={cn('p-4', i > 0 && 'sm:border-l border-hairline', i % 2 === 1 && 'border-l')}>
                <dt className="mono-label text-muted-foreground">{k}</dt>
                <dd className="mono mt-2 text-lg">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right: Role-specific panel (Customer booking vs Admin vehicle control) */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-20">
            <p className="mono-label text-muted-foreground">{c.make}</p>
            <h1 className="display-condensed mt-2 text-[clamp(3rem,6vw,5.5rem)]">{c.model}</h1>
            <div className="mt-4 flex items-center gap-4">
              <Counter value={c.pricePerDay} prefix="₹ " suffix=" / day" className="text-2xl" />
              <StatusPill status={c.available ? 'available' : 'out'} />
            </div>

            {isAdmin ? (
              <div className="mt-8 space-y-6 border-t border-hairline pt-8">
                <div className="flex items-center justify-between border border-hairline bg-card px-4 py-3">
                  <div>
                    <p className="mono-label text-red-deep">ROLE · ADMIN</p>
                    <p className="text-sm font-medium">Fleet Management Controls</p>
                  </div>
                  <Button asChild variant="secondary" className="min-h-9 px-3 text-xs">
                    <Link to="/admin">Open Admin Console →</Link>
                  </Button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    adminUpdate.mutate()
                  }}
                  className="ticks space-y-5 border border-hairline bg-card p-6"
                >
                  <p className="mono-label text-muted-foreground">Quick-edit vehicle (#{c.id})</p>
                  <Input label="Vehicle name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <Input
                    label="Daily rate (₹)"
                    type="number"
                    min={1}
                    value={editRate}
                    onChange={(e) => setEditRate(Number(e.target.value))}
                  />
                  <label className="block">
                    <span className="mono-label text-muted-foreground">Category</span>
                    <select
                      value={editCatId}
                      onChange={(e) => setEditCatId(Number(e.target.value))}
                      className="mt-2 w-full cursor-pointer border border-hairline bg-background px-3 py-2.5 text-sm font-medium text-ink outline-none focus:border-signal"
                    >
                      {categories.data?.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-card text-ink">
                          {cat.name} ({Number(cat.discountPercent)}% discount)
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex min-h-11 cursor-pointer items-center justify-between border border-hairline px-4">
                    <span className="text-sm font-medium">Available on the lot</span>
                    <input
                      type="checkbox"
                      checked={editAvail}
                      onChange={(e) => setEditAvail(e.target.checked)}
                      className="size-5 accent-[var(--odo-signal)]"
                    />
                  </label>
                  <Button type="submit" arrow className="w-full" disabled={adminUpdate.isPending}>
                    {adminUpdate.isPending ? 'Saving changes…' : 'Save vehicle changes'}
                  </Button>
                </form>

                <p className="mono-label text-muted-foreground">
                  Note: Creating customer bookings (POST /api/rentals) requires a CUSTOMER account. Sign in as a customer to place a reservation.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  book.mutate()
                }}
                className="mt-8 space-y-8 border-t border-hairline pt-8"
                noValidate
              >
                {/* Authenticated Customer Identity Readout */}
                {user && isCustomer && (
                  <div className="flex items-center justify-between border border-hairline bg-card px-4 py-3">
                    <div>
                      <p className="mono-label text-muted-foreground">Authenticated Driver · {user.role}</p>
                      <p className="font-medium text-ink">{user.name}</p>
                      <p className="mono text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <span className="mono-label border border-hairline px-2 py-1 text-pit">Verified JWT</span>
                  </div>
                )}

                {/* Trip */}
                <fieldset>
                  <legend className="mono-label text-muted-foreground">Trip duration & dates</legend>
                  <div className="mt-3 grid grid-cols-1 border border-hairline bg-card sm:grid-cols-2">
                    <label className="flex flex-col justify-between border-b border-hairline p-4 sm:border-b-0 sm:border-r">
                      <span className="mono-label text-muted-foreground">Duration (days)</span>
                      <select
                        value={days}
                        onChange={(e) => setDays(clampDays(Number(e.target.value)))}
                        className="mt-2 w-full cursor-pointer border border-hairline bg-background px-3 py-2 text-sm font-medium text-ink outline-none focus:border-signal"
                      >
                        {Array.from({ length: MAX_DAYS }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d} className="bg-card text-ink">
                            {d} {d === 1 ? 'day' : 'days'} — {formatINR(c.pricePerDay * d)}
                          </option>
                        ))}
                      </select>
                      <span className="mono-label mt-2 text-muted-foreground">Pick-up: Today ({prettyDate(today())})</span>
                    </label>

                    <label className="flex flex-col justify-between p-4">
                      <span className="mono-label text-muted-foreground">Return date</span>
                      <input
                        type="date"
                        value={returnDateFor(days)}
                        min={returnDateFor(1)}
                        max={returnDateFor(MAX_DAYS)}
                        onChange={(e) => e.target.value && setDays(clampDays(daysUntil(e.target.value)))}
                        className="mt-2 w-full cursor-pointer border border-hairline bg-background px-3 py-2 text-sm font-medium text-ink outline-none focus:border-signal"
                      />
                      <span className="mono-label mt-2 text-muted-foreground">Return: {prettyDate(returnDateFor(days))}</span>
                    </label>
                  </div>
                </fieldset>

                {/* Offer */}
                <fieldset>
                  <legend className="mono-label text-muted-foreground">Offer · one per rental</legend>

                  <label className="mt-3 block">
                    <span className="sr-only">Select offer type</span>
                    <select
                      value={benefit}
                      onChange={(e) => selectBenefit(e.target.value as BenefitType)}
                      className="w-full cursor-pointer border border-hairline bg-card px-3 py-2.5 text-sm font-medium text-ink outline-none focus:border-signal"
                    >
                      {benefits.map((b) => (
                        <option key={b.v} value={b.v} disabled={b.disabled} className="bg-card text-ink">
                          {b.label} — {b.note}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="mt-3 grid grid-cols-2 items-stretch gap-2">
                    {benefits.map((b) => (
                      <button
                        key={b.v}
                        type="button"
                        disabled={b.disabled}
                        onClick={() => selectBenefit(b.v)}
                        aria-pressed={benefit === b.v}
                        className={cn(
                          'flex h-full flex-col justify-between border p-3 text-left transition-colors duration-200',
                          benefit === b.v ? 'border-ink bg-ink text-paper' : 'border-hairline bg-card text-ink hover:border-ink',
                          b.disabled && 'pointer-events-none opacity-40',
                        )}
                      >
                        <span className="block text-sm font-medium">{b.label}</span>
                        <span className="mt-1 block text-xs opacity-75">{b.note}</span>
                      </button>
                    ))}
                  </div>

                  {benefit === 'COUPON' && (
                    <div className="mt-4 space-y-4 border border-hairline bg-card p-4">
                      <label className="block">
                        <span className="mono-label text-muted-foreground">Choose an available coupon</span>
                        <select
                          value={coupon?.code ?? ''}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="mt-2 w-full cursor-pointer border border-hairline bg-background px-3 py-2.5 text-sm font-medium text-ink outline-none focus:border-signal"
                        >
                          <option value="" className="bg-card text-ink">— Select a coupon code —</option>
                          {coupons.data?.map((cp) => (
                            <option key={cp.id} value={cp.code} className="bg-card text-ink">
                              {cp.code} · {couponDescription(cp)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Input
                        label="Or type coupon code"
                        placeholder="e.g. WELCOME50"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                    </div>
                  )}
                </fieldset>

                {/* Receipt */}
                <div className="border border-dashed border-hairline bg-card p-5">
                  <dl className="mono space-y-2 text-sm">
                    <div className="flex gap-2"><dt>{formatINR(c.pricePerDay)} × {days} {days === 1 ? 'day' : 'days'}</dt><span className="flex-1 border-b border-dotted border-hairline" /><dd>{formatINR(gross)}</dd></div>
                    {pct > 0 && <div className="flex gap-2 text-red-deep"><dt>Discount {pct}%</dt><span className="flex-1 border-b border-dotted border-hairline" /><dd>− {formatINR(gross - total)}</dd></div>}
                    <div className="flex gap-2 text-muted-foreground"><dt>Taxes</dt><span className="flex-1 border-b border-dotted border-hairline" /><dd>Included</dd></div>
                  </dl>
                  <div className="mt-4 flex items-end justify-between border-t border-hairline pt-4">
                    <span className="mono-label">Estimated total</span>
                    <Counter value={total} prefix="₹ " className="text-3xl font-medium" />
                  </div>
                  {benefit === 'COUPON' && couponCode && !coupon && <p className="mt-2 text-xs text-muted-foreground">Code not recognised yet. The server checks it when you confirm.</p>}
                </div>

                <Button type="submit" arrow className="min-h-14 w-full" disabled={!c.available || book.isPending}>
                  {book.isPending ? 'Printing your agreement…' : c.available ? 'Reserve this car' : 'Out on the road'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-24">
          <p className="mono-label text-muted-foreground">More {c.category.name}</p>
          <div className="mt-6 grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s, i) => <CarCard key={s.id} car={s} days={days} index={i} />)}
          </div>
        </section>
      )}
    </div>
  )
}
