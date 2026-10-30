import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { api, isApiError, type Rental } from '@/api'
import { vehicleToCar } from '@/api/http'
import { useCustomers } from '@/hooks/queries'
import { CarImage } from '@/components/car/CarImage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusPill } from '@/components/ui/status-pill'
import { prettyDate } from '@/lib/trip'
import { cn, formatINR } from '@/lib/utils'
import { bookingRef } from './Ticket'

type Tab = 'ACTIVE' | 'COMPLETED'

export default function MyBookings() {
  const qc = useQueryClient()
  const customers = useCustomers()
  const [email, setEmail] = useState(localStorage.getItem('odo-email') ?? '')
  const [draft, setDraft] = useState(email)
  const [tab, setTab] = useState<Tab>('ACTIVE')
  const [confirm, setConfirm] = useState<Rental | null>(null)
  const key = ['bookings', email]

  const q = useQuery({ queryKey: key, queryFn: () => api.bookingsByEmail(email), enabled: !!email })

  const ret = useMutation({
    mutationFn: (id: number) => api.cancelBooking(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Rental[]>(key)
      qc.setQueryData<Rental[]>(key, (l) => l?.map((r) => (r.id === id ? { ...r, status: 'COMPLETED' } : r)))
      return { prev }
    },
    onError: (e, _id, ctx) => {
      qc.setQueryData(key, ctx?.prev)
      toast.error(isApiError(e) ? e.message : 'Could not end the rental. Try again.')
    },
    onSuccess: (r) => toast.success(`${r.vehicle.name} returned. ${bookingRef(r.id)} is complete.`),
    onSettled: () => { qc.invalidateQueries({ queryKey: key }); qc.invalidateQueries({ queryKey: ['cars'] }) },
  })

  const list = (q.data ?? []).filter((r) => r.status === tab)
  const counts = { ACTIVE: q.data?.filter((r) => r.status === 'ACTIVE').length ?? 0, COMPLETED: q.data?.filter((r) => r.status === 'COMPLETED').length ?? 0 }

  const chooseEmail = (v: string) => {
    const clean = v.trim()
    setDraft(clean)
    setEmail(clean)
    localStorage.setItem('odo-email', clean)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-[clamp(3rem,7vw,5.5rem)] font-extrabold leading-none tracking-[-0.03em]">My bookings</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); chooseEmail(draft) }}
        className="mt-8 grid gap-4 border border-hairline bg-card p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <Input label="Email used to book" type="email" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="you@example.com" />

        <label className="flex flex-col gap-1">
          <span className="mono-label text-muted-foreground">Or select a customer</span>
          <select
            value={email}
            onChange={(e) => e.target.value && chooseEmail(e.target.value)}
            className="min-h-11 w-full cursor-pointer border-b border-hairline bg-card text-sm font-medium text-ink outline-none focus:border-signal"
          >
            <option value="" className="bg-card text-ink">— Select a customer account —</option>
            {customers.data?.slice(0, 60).map((c) => (
              <option key={c.id} value={c.email} className="bg-card text-ink">
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </label>

        <Button type="submit" variant="secondary">Find bookings</Button>
      </form>

      {!email ? (
        <p className="serif-italic mt-16 text-4xl text-muted-foreground">Enter your email or choose a customer above to see trips.</p>
      ) : (
        <>
          <div role="tablist" className="mt-12 flex border-b border-hairline">
            {(['ACTIVE', 'COMPLETED'] as Tab[]).map((t) => (
              <button
                key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                className={cn('relative min-h-11 px-5 text-sm font-medium', tab === t ? 'text-ink' : 'text-muted-foreground')}
              >
                {t === 'ACTIVE' ? 'Active' : 'Past'} <span className="mono ml-1 text-xs">{counts[t]}</span>
                {tab === t && <motion.span layoutId="tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-signal" />}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4" role="tabpanel">
            {q.isLoading && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-32" />)}
            {q.isError && (
              <div role="alert" className="border border-hairline p-8">
                <p className="serif-italic text-4xl">The garage is closed.</p>
                <Button variant="secondary" className="mt-4" onClick={() => q.refetch()}>Retry</Button>
              </div>
            )}
            {q.data && list.length === 0 && (
              <div className="border border-hairline p-10">
                <p className="serif-italic text-4xl">{tab === 'ACTIVE' ? 'No trips on the road.' : 'No past trips yet.'}</p>
                <Button asChild className="mt-6" arrow><Link to="/fleet">See the fleet</Link></Button>
              </div>
            )}
            <AnimatePresence initial={false}>
              {list.map((r, i) => {
                const car = vehicleToCar(r.vehicle)
                return (
                  <motion.article
                    key={r.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.4, delay: Math.min(i, 10) * 0.04 }}
                    className="grid items-center gap-4 border border-hairline bg-card sm:grid-cols-[200px_1fr_auto]"
                  >
                    <CarImage src={car.imageUrl} alt={car.name} category={car.category.name} className="aspect-[16/10] w-full" />
                    <div className="p-4 sm:py-4 sm:pl-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link to={`/bookings/${r.id}`} className="mono text-sm font-medium hover:underline">{bookingRef(r.id)}</Link>
                        <StatusPill status={r.status === 'ACTIVE' ? 'reserved' : 'available'} />
                      </div>
                      <p className="display-condensed mt-2 truncate text-3xl">{car.name}</p>
                      <p className="mono-label mt-1 text-muted-foreground">{prettyDate(r.startDate)} → {prettyDate(r.endDate)} · {r.days} days</p>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-hairline p-4 sm:flex-col sm:items-end sm:border-0">
                      <p className="mono text-xl font-medium">{formatINR(Number(r.totalAmount))}</p>
                      {r.status === 'ACTIVE' && <Button variant="secondary" className="min-h-9 px-4" onClick={() => setConfirm(r)}>Return car</Button>}
                    </div>
                  </motion.article>
                )
              })}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirm && (
          <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-6" data-lenis-prevent initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/50" onClick={() => setConfirm(null)} />
            <motion.div role="alertdialog" aria-modal aria-labelledby="ret-title" initial={{ y: 16 }} animate={{ y: 0 }} className="relative w-full max-w-md border border-hairline bg-background p-8">
              <p id="ret-title" className="text-2xl font-semibold">Return {confirm.vehicle.name}?</p>
              <p className="mt-2 text-muted-foreground">This ends {bookingRef(confirm.id)} and puts the car back on the lot. It can't be undone.</p>
              <div className="mt-8 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setConfirm(null)}>Keep it</Button>
                <Button onClick={() => { ret.mutate(confirm.id); setConfirm(null) }}>Return car</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
