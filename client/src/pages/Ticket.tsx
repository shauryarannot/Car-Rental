import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { api, isApiError, type Rental } from '@/api'
import { CarImage } from '@/components/car/CarImage'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusPill } from '@/components/ui/status-pill'
import { vehicleToCar } from '@/api/http'
import { bookingRef, formatINR } from '@/lib/utils'
import { prettyDate } from '@/lib/trip'
import { BRANCH, BRANCH_DIRECTIONS } from '@/lib/location'

function computeBarcodeBars(seed: number): number[] {
  let x = seed * 9301 + 49297
  return Array.from({ length: 48 }, () => {
    x = (x * 9301 + 49297) % 233280
    return 1 + Math.floor((x / 233280) * 3)
  })
}

/** Deterministic barcode bars from the booking id. */
function Barcode({ seed }: { seed: number }) {
  const bars = computeBarcodeBars(seed)
  return (
    <div aria-hidden className="flex h-14 max-w-full items-stretch gap-[2px] overflow-hidden">
      {bars.map((w, i) => <span key={i} className="shrink-0 bg-ink" style={{ width: w }} />)}
    </div>
  )
}

function downloadIcs(r: Rental) {
  const d = (s: string) => s.replace(/-/g, '')
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ryde.exe//Car Rental//EN', 'BEGIN:VEVENT',
    `UID:${bookingRef(r.id)}@ryde.exe`, `DTSTART;VALUE=DATE:${d(r.startDate)}`, `DTEND;VALUE=DATE:${d(r.endDate)}`,
    `SUMMARY:${r.vehicle.name} rental (${bookingRef(r.id)})`, `DESCRIPTION:Total ${formatINR(Number(r.totalAmount))}`,
    `LOCATION:${BRANCH.address.replace(/,/g, '\\,')}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  a.download = `${bookingRef(r.id)}.ics`
  a.click()
}

export default function Ticket() {
  const { id } = useParams()
  const q = useQuery({ queryKey: ['booking', Number(id)], queryFn: () => api.getBooking(Number(id)) })

  if (q.isLoading) return <div className="mx-auto max-w-5xl px-6 py-16"><Skeleton className="h-80" /></div>
  if (q.isError || !q.data) {
    const nf = isApiError(q.error) && q.error.status === 404
    return (
      <div className="mx-auto max-w-5xl px-6 py-24">
        <p className="serif-italic text-5xl">{nf ? 'Wrong turn.' : 'The garage is closed.'}</p>
        <p className="mt-2 text-muted-foreground">{nf ? "We couldn't find that booking." : 'Try again.'}</p>
        <Button asChild variant="secondary" className="mt-6"><Link to="/bookings">My bookings</Link></Button>
      </div>
    )
  }
  const r = q.data
  const car = vehicleToCar(r.vehicle)
  const discount = Number(r.discountPercent) || 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="mono-label text-muted-foreground">Booking confirmed</p>
      <h1 className="mt-2 text-[clamp(2.25rem,6vw,4.5rem)] font-extrabold leading-none tracking-[-0.03em]">
        You're <span className="serif-italic font-normal text-red-deep">set.</span>
      </h1>

      <motion.article
        initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 grid border border-hairline bg-card sm:mt-10 md:grid-cols-[1fr_auto_1.2fr]"
      >
        <div className="p-5 sm:p-6">
          <CarImage src={car.imageUrl} alt={car.name} category={car.category.name} className="aspect-[16/10]" eager />
          <p className="mono-label mt-4 text-muted-foreground">{car.make}</p>
          <p className="display-condensed text-3xl sm:text-4xl">{car.model}</p>
        </div>
        {/* Perforation */}
        <div aria-hidden className="relative hidden w-8 md:block">
          <span className="absolute -top-4 left-0 size-8 rounded-full border border-hairline bg-background" />
          <span className="absolute inset-y-6 left-1/2 border-l border-dashed border-hairline" />
          <span className="absolute -bottom-4 left-0 size-8 rounded-full border border-hairline bg-background" />
        </div>
        <div className="border-t border-dashed border-hairline p-5 sm:p-6 md:border-t-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="mono-label text-muted-foreground">Reference</p>
              <p className="mono text-2xl font-medium tracking-wider sm:text-3xl">{bookingRef(r.id)}</p>
            </div>
            <StatusPill status={r.status === 'ACTIVE' ? 'reserved' : 'available'} />
          </div>
          <dl className="mono mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div><dt className="mono-label text-muted-foreground">Pick-up</dt><dd className="mt-1">{prettyDate(r.startDate)}</dd></div>
            <div><dt className="mono-label text-muted-foreground">Return</dt><dd className="mt-1">{prettyDate(r.endDate)}</dd></div>
            <div><dt className="mono-label text-muted-foreground">Driver</dt><dd className="mt-1 truncate">{r.customer.name}</dd></div>
            <div><dt className="mono-label text-muted-foreground">Days</dt><dd className="mt-1">{r.days}</dd></div>
            <div><dt className="mono-label text-muted-foreground">Offer</dt><dd className="mt-1">{r.couponCode ?? (r.benefitType === 'NONE' ? '—' : r.benefitType.replace('_', ' ').toLowerCase())}{discount ? ` · ${discount}%` : ''}</dd></div>
            <div><dt className="mono-label text-muted-foreground">Total</dt><dd className="mt-1 text-lg font-medium">{formatINR(Number(r.totalAmount))}</dd></div>
            <div className="col-span-2">
              <dt className="mono-label text-muted-foreground">Pick-up & drop-off</dt>
              <dd className="mt-1">
                {BRANCH.address} ·{' '}
                <a href={BRANCH_DIRECTIONS} target="_blank" rel="noreferrer" className="text-red-deep hover:underline">
                  Directions
                </a>
              </dd>
            </div>
          </dl>
          <div className="mt-6"><Barcode seed={r.id} /></div>
        </div>
      </motion.article>

      <div className="no-print mt-8 flex flex-wrap gap-3">
        <Button onClick={() => window.print()} arrow>Print or save PDF</Button>
        <Button variant="secondary" onClick={() => downloadIcs(r)}>Add to calendar</Button>
        <Button variant="ghost" asChild><Link to="/bookings">My bookings</Link></Button>
      </div>
    </div>
  )
}
