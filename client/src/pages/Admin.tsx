import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import {
  api,
  isApiError,
  type Car,
  type Category,
  type CouponType,
  type Customer,
  type DiscountCoupon,
} from '@/api'
import { useAuth } from '@/app/auth'
import { useAllBookings, useCars, useCategories, useCoupons, useCustomers } from '@/hooks/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusPill } from '@/components/ui/status-pill'
import { Counter } from '@/components/fx/Counter'
import { prettyDate } from '@/lib/trip'
import { bookingRef, cn, formatINR } from '@/lib/utils'

type AdminTab = 'fleet' | 'rentals' | 'categories' | 'coupons' | 'customers'

const actionBtn = 'mono-label border border-hairline px-2.5 py-1.5 hover:border-ink'
const dangerBtn = 'mono-label border border-hairline px-2.5 py-1.5 text-red-deep hover:border-red-deep'
const searchClass = 'min-h-11 flex-1 border border-hairline bg-card px-4 text-sm text-ink outline-none focus:border-signal'
const selectClass = 'mt-2 w-full cursor-pointer border border-hairline bg-card px-3 py-2.5 text-sm font-medium text-ink outline-none focus:border-signal'

const errMsg = (e: unknown, fallback: string) => (isApiError(e) ? e.message : fallback)

function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto border border-hairline bg-card">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-hairline bg-surface-alt mono-label text-muted-foreground">
            {headers.map((h, i) => (
              <th key={h} className={cn('p-4', i === headers.length - 1 && 'text-right')}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">{children}</tbody>
      </table>
    </div>
  )
}

function SlideOver({
  open,
  onClose,
  maxWidth = 'max-w-md',
  children,
}: {
  open: boolean
  onClose: () => void
  maxWidth?: string
  children: ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex justify-end" data-lenis-prevent initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal
            className={cn(
              'relative z-10 flex h-full w-full flex-col justify-between overflow-y-auto border-l border-hairline bg-background p-6 sm:p-8',
              maxWidth,
            )}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function FormSlideOver({
  open,
  title,
  saveLabel,
  pending,
  onClose,
  onSubmit,
  children,
}: {
  open: boolean
  title: string
  saveLabel: string
  pending: boolean
  onClose: () => void
  onSubmit: () => void
  children: ReactNode
}) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }
  return (
    <SlideOver open={open} onClose={onClose}>
      {open && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between border-b border-hairline pb-4">
            <p className="mono-label">{title}</p>
            <button type="button" className="mono-label" onClick={onClose}>
              Close
            </button>
          </div>
          {children}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? 'Saving…' : saveLabel}
            </Button>
          </div>
        </form>
      )}
    </SlideOver>
  )
}

export default function Admin() {
  const { user, isAdmin } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState<AdminTab>('fleet')

  const cars = useCars()
  const categories = useCategories()
  const coupons = useCoupons()
  const customers = useCustomers()
  const bookings = useAllBookings()

  const [carSearch, setCarSearch] = useState('')
  const [carCatFilter, setCarCatFilter] = useState('')
  const [rentalFilter, setRentalFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE')
  const [rentalSearch, setRentalSearch] = useState('')
  const [custSearch, setCustSearch] = useState('')

  const [vehicleModal, setVehicleModal] = useState<{
    id?: number
    name: string
    dailyRate: number
    available: boolean
    categoryId: number
  } | null>(null)

  const [categoryModal, setCategoryModal] = useState<{
    id?: number
    name: string
    discountPercent: number
  } | null>(null)

  const [couponModal, setCouponModal] = useState<{
    id?: number
    code: string
    couponType: CouponType
    discountPercent: number
    minDays: string
    maxDays: string
  } | null>(null)

  const [customerModal, setCustomerModal] = useState<{
    id?: number
    name: string
    email: string
    phone: string
    employeeId: string
  } | null>(null)

  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null)

  const customerHistoryQuery = useQuery({
    queryKey: ['customer-history', historyCustomer?.id],
    queryFn: () => api.customerBookings(historyCustomer!.id),
    enabled: !!historyCustomer,
  })

  // --- Mutations ---
  const saveVehicle = useMutation({
    mutationFn: (v: NonNullable<typeof vehicleModal>) => {
      const payload = {
        name: v.name.trim(),
        dailyRate: Number(v.dailyRate),
        available: v.available,
        category: { id: Number(v.categoryId) },
      }
      return v.id ? api.updateVehicle(v.id, payload) : api.createVehicle(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cars'] })
      setVehicleModal(null)
      toast.success('Vehicle saved.')
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to save vehicle.')),
  })

  const toggleVehicleAvail = useMutation({
    mutationFn: (c: Car) =>
      api.updateVehicle(c.id, {
        name: c.name,
        dailyRate: c.pricePerDay,
        available: !c.available,
        category: { id: c.category.id },
      }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['cars'] })
      toast.success(`${updated.name} marked ${updated.available ? 'Available' : 'Out'}.`)
    },
    onError: (e) => toast.error(errMsg(e, 'Could not update availability.')),
  })

  const removeVehicle = useMutation({
    mutationFn: (id: number) => api.deleteVehicle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cars'] })
      toast.success('Vehicle deleted.')
    },
    onError: (e) => toast.error(errMsg(e, 'Cannot delete a vehicle with existing rental history.')),
  })

  const saveCategory = useMutation({
    mutationFn: (c: NonNullable<typeof categoryModal>) => {
      const payload = { name: c.name.trim(), discountPercent: Number(c.discountPercent) }
      return c.id ? api.updateCategory(c.id, payload) : api.createCategory(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['cars'] })
      setCategoryModal(null)
      toast.success('Category saved.')
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to save category.')),
  })

  const removeCategory = useMutation({
    mutationFn: (id: number) => api.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted.')
    },
    onError: (e) => toast.error(errMsg(e, 'Cannot delete a category that still has vehicles.')),
  })

  const saveCoupon = useMutation({
    mutationFn: (c: NonNullable<typeof couponModal>) => {
      const isDur = c.couponType === 'DURATION'
      const payload = {
        code: c.code.trim().toUpperCase(),
        couponType: c.couponType,
        discountPercent: c.couponType === 'FIRST_RENTAL' ? 50 : Number(c.discountPercent),
        minDays: isDur && c.minDays ? Number(c.minDays) : null,
        maxDays: isDur && c.maxDays ? Number(c.maxDays) : null,
      }
      return c.id ? api.updateCoupon(c.id, payload) : api.createCoupon(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons'] })
      setCouponModal(null)
      toast.success('Coupon saved.')
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to save coupon.')),
  })

  const removeCoupon = useMutation({
    mutationFn: (id: number) => api.deleteCoupon(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons'] })
      toast.success('Coupon deleted.')
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to delete coupon.')),
  })

  const saveCustomer = useMutation({
    mutationFn: (c: NonNullable<typeof customerModal>) => {
      const payload = {
        name: c.name.trim(),
        email: c.email.trim(),
        phone: c.phone.trim() || null,
        employeeId: c.employeeId.trim() || null,
      }
      return c.id ? api.updateCustomer(c.id, payload) : api.createCustomer(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      setCustomerModal(null)
      toast.success('Customer saved.')
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to save customer.')),
  })

  const deactivateCustomer = useMutation({
    mutationFn: (id: number) => api.deactivateCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer deactivated.')
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to deactivate customer.')),
  })

  const returnRental = useMutation({
    mutationFn: (id: number) => api.cancelBooking(id),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['all-bookings'] })
      qc.invalidateQueries({ queryKey: ['cars'] })
      toast.success(`Returned ${r.vehicle.name} (${bookingRef(r.id)}).`)
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to return rental.')),
  })

  // --- Computed stats & filtered lists ---
  const stats = useMemo(() => {
    const allRentals = bookings.data ?? []
    const revenue = allRentals.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0)
    const activeCount = allRentals.filter((r) => r.status === 'ACTIVE').length
    const totalCars = cars.data?.length ?? 0
    const availCars = cars.data?.filter((c) => c.available).length ?? 0
    return { revenue, activeCount, totalCars, availCars, totalRentals: allRentals.length }
  }, [bookings.data, cars.data])

  const filteredCars = useMemo(() => {
    let list = cars.data ?? []
    if (carCatFilter) list = list.filter((c) => String(c.category.id) === carCatFilter)
    if (carSearch) list = list.filter((c) => c.name.toLowerCase().includes(carSearch.toLowerCase()))
    return list
  }, [cars.data, carCatFilter, carSearch])

  const filteredRentals = useMemo(() => {
    let list = [...(bookings.data ?? [])].sort((a, b) => b.id - a.id)
    if (rentalFilter !== 'ALL') list = list.filter((r) => r.status === rentalFilter)
    if (rentalSearch) {
      const q = rentalSearch.toLowerCase()
      list = list.filter(
        (r) =>
          r.vehicle.name.toLowerCase().includes(q) ||
          r.customer.name.toLowerCase().includes(q) ||
          r.customer.email.toLowerCase().includes(q) ||
          bookingRef(r.id).toLowerCase().includes(q),
      )
    }
    return list
  }, [bookings.data, rentalFilter, rentalSearch])

  const filteredCustomers = useMemo(() => {
    const list = customers.data ?? []
    if (!custSearch) return list
    const q = custSearch.toLowerCase()
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.employeeId?.toLowerCase().includes(q),
    )
  }, [customers.data, custSearch])

  const openNewVehicleModal = () =>
    setVehicleModal({ name: '', dailyRate: 2500, available: true, categoryId: categories.data?.[0]?.id ?? 1 })

  const openNewCouponModal = () =>
    setCouponModal({ code: '', couponType: 'DURATION', discountPercent: 15, minDays: '3', maxDays: '7' })

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24">
        <p className="mono-label text-red-deep">403 — CLEARANCE REQUIRED</p>
        <h1 className="mt-3 text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-none tracking-[-0.03em]">
          Administrator access <span className="serif-italic font-normal text-red-deep">only.</span>
        </h1>
        <p className="mt-4 max-w-lg text-muted-foreground">
          You are currently signed in as {user?.name ?? 'a guest'} ({user?.role ?? 'UNAUTHENTICATED'}). Sign in with an ADMIN account to manage vehicles, categories, coupons, and customers.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild arrow>
            <Link to="/login">Switch to Admin account</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/fleet">Back to the fleet</Link>
          </Button>
        </div>
      </div>
    )
  }

  const tabs: { id: AdminTab; label: string; count?: number }[] = [
    { id: 'fleet', label: 'Fleet Vehicles', count: cars.data?.length },
    { id: 'rentals', label: 'Rentals & Timeline', count: bookings.data?.length },
    { id: 'categories', label: 'Categories', count: categories.data?.length },
    { id: 'coupons', label: 'Coupons', count: coupons.data?.length },
    { id: 'customers', label: 'Customers', count: customers.data?.length },
  ]

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-14">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6 sm:gap-6 sm:pb-8">
        <div>
          <p className="mono-label text-red-deep">ROLE · ADMIN — CONTROL INSTRUMENT</p>
          <h1 className="mt-2 pt-1 text-[clamp(2.25rem,5vw,4.5rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
            Fleet & Operations
          </h1>
        </div>
        <div className="flex w-full flex-wrap gap-3 sm:w-auto">
          <Button onClick={openNewVehicleModal} arrow className="flex-1 sm:flex-initial">
            + Add vehicle
          </Button>
          <Button variant="secondary" onClick={openNewCouponModal} className="flex-1 sm:flex-initial">
            + Add coupon
          </Button>
        </div>
      </div>

      {/* Night Drive Instrument Readout Band */}
      <div className="night-drive mt-8 grid grid-cols-1 gap-px border border-hairline bg-[var(--odo-hairline)] text-[var(--odo-text)] sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Cumulative Revenue', value: stats.revenue, prefix: '₹', sub: `Across ${stats.totalRentals} rentals` },
          { label: 'Active on the Road', value: stats.activeCount, suffix: ' Cars', sub: 'Currently dispatched' },
          { label: 'Available on the Lot', value: stats.availCars, suffix: ` / ${stats.totalCars}`, sub: 'Ready for immediate booking' },
          { label: 'Active Customers', value: customers.data?.length ?? 0, sub: 'Verified accounts' },
          { label: 'Active Coupons', value: coupons.data?.length ?? 0, sub: 'Available offers' },
        ].map((s, i) => (
          <div
            key={s.label}
            className={cn(
              'flex flex-col justify-between bg-[var(--odo-bg)] p-5 sm:p-6',
              i === 4 && 'sm:col-span-2 lg:col-span-1',
            )}
          >
            <p className="mono-label text-[var(--odo-muted)]">{s.label}</p>
            <Counter
              value={s.value}
              prefix={s.prefix}
              suffix={s.suffix}
              className="glow my-4 whitespace-nowrap text-2xl font-medium text-[var(--odo-amber)] xl:text-[1.75rem]"
            />
            <p className="mono-label text-[var(--odo-muted)]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Section Tabs */}
      <div role="tablist" className="mt-8 flex items-center gap-2 overflow-x-auto border-b border-hairline sm:mt-10 sm:gap-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'relative inline-flex min-h-12 shrink-0 items-center gap-2.5 whitespace-nowrap px-4 text-sm font-medium leading-none transition-colors sm:px-5',
              tab === t.id ? 'text-ink' : 'text-muted-foreground hover:text-ink',
            )}
          >
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span className="mono inline-flex items-center text-xs leading-none text-muted-foreground">
                {t.count}
              </span>
            )}
            {tab === t.id && <motion.span layoutId="admin-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-signal" />}
          </button>
        ))}
      </div>

      {/* TAB 1: FLEET VEHICLES */}
      {tab === 'fleet' && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="search"
              value={carSearch}
              onChange={(e) => setCarSearch(e.target.value)}
              placeholder="Filter vehicles by make or model…"
              className={cn(searchClass, 'sm:max-w-sm')}
            />
            <select
              value={carCatFilter}
              onChange={(e) => setCarCatFilter(e.target.value)}
              className="min-h-11 cursor-pointer border border-hairline bg-card px-4 text-sm text-ink outline-none focus:border-signal"
            >
              <option value="" className="bg-card text-ink">All categories</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={String(c.id)} className="bg-card text-ink">
                  {c.name}
                </option>
              ))}
            </select>
            <Button variant="secondary" className="ml-auto min-h-11" onClick={openNewVehicleModal}>
              + New Vehicle
            </Button>
          </div>

          <DataTable headers={['ID', 'Vehicle', 'Category', 'Daily Rate', 'Status', 'Actions']}>
            {filteredCars.map((c) => (
              <tr key={c.id} className="hover:bg-surface-alt/50">
                <td className="mono p-4 text-muted-foreground">#{c.id}</td>
                <td className="p-4 font-semibold">
                  <Link to={`/fleet/${c.id}`} className="hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="mono-label p-4">
                  {c.category.name}
                  {Number(c.category.discountPercent) > 0 && (
                    <span className="ml-2 text-red-deep">(-{Number(c.category.discountPercent)}%)</span>
                  )}
                </td>
                <td className="mono p-4 font-medium">{formatINR(c.pricePerDay)}</td>
                <td className="p-4">
                  <StatusPill status={c.available ? 'available' : 'out'} />
                </td>
                <td className="p-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button type="button" onClick={() => toggleVehicleAvail.mutate(c)} className={actionBtn}>
                      {c.available ? 'Mark Out' : 'Mark Available'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setVehicleModal({
                          id: c.id,
                          name: c.name,
                          dailyRate: c.pricePerDay,
                          available: c.available,
                          categoryId: c.category.id,
                        })
                      }
                      className={actionBtn}
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => removeVehicle.mutate(c.id)} className={dangerBtn}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      {/* TAB 2: RENTALS & TIMELINE */}
      {tab === 'rentals' && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex border border-hairline bg-card">
              {(['ACTIVE', 'COMPLETED', 'ALL'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setRentalFilter(status)}
                  className={cn(
                    'mono-label min-h-11 px-4 transition-colors',
                    rentalFilter === status ? 'bg-ink text-paper' : 'text-ink hover:bg-surface-alt',
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
            <input
              type="search"
              value={rentalSearch}
              onChange={(e) => setRentalSearch(e.target.value)}
              placeholder="Search by customer, vehicle, or reference (Ryde.exe-…)…"
              className={cn(searchClass, 'sm:max-w-md')}
            />
            <span className="mono-label ml-auto text-muted-foreground">
              Showing {Math.min(filteredRentals.length, 150)} of {filteredRentals.length}
            </span>
          </div>

          <DataTable headers={['Ref', 'Customer', 'Vehicle', 'Dates & Duration', 'Benefit', 'Total', 'Status', 'Actions']}>
            {filteredRentals.slice(0, 150).map((r) => (
              <tr key={r.id} className="hover:bg-surface-alt/50">
                <td className="mono p-4 font-medium">
                  <Link to={`/bookings/${r.id}`} className="hover:underline">
                    {bookingRef(r.id)}
                  </Link>
                </td>
                <td className="p-4">
                  <p className="font-medium">{r.customer.name}</p>
                  <p className="mono text-xs text-muted-foreground">{r.customer.email}</p>
                </td>
                <td className="p-4 font-medium">{r.vehicle.name}</td>
                <td className="mono p-4 text-xs">
                  {prettyDate(r.startDate)} → {prettyDate(r.endDate)} ({r.days}d)
                </td>
                <td className="mono-label p-4 text-muted-foreground">
                  {r.couponCode ?? (r.benefitType === 'NONE' ? '—' : r.benefitType)}
                  {Number(r.discountPercent) > 0 && ` (-${Number(r.discountPercent)}%)`}
                </td>
                <td className="mono p-4 font-medium">{formatINR(Number(r.totalAmount))}</td>
                <td className="p-4">
                  <StatusPill status={r.status === 'ACTIVE' ? 'reserved' : 'available'} />
                </td>
                <td className="p-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link to={`/bookings/${r.id}`} className={actionBtn}>
                      Ticket
                    </Link>
                    {r.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => returnRental.mutate(r.id)}
                        className="mono-label border border-ink bg-ink px-2.5 py-1.5 text-paper hover:border-signal hover:bg-signal"
                      >
                        Return Car
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      {/* TAB 3: CATEGORIES */}
      {tab === 'categories' && (
        <div className="mt-8 space-y-6">
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setCategoryModal({ name: '', discountPercent: 0 })}>
              + New Category
            </Button>
          </div>

          <DataTable headers={['ID', 'Category Name', 'Category Discount', 'Vehicles Assigned', 'Actions']}>
            {categories.data?.map((cat: Category) => {
              const count = cars.data?.filter((v) => v.category.id === cat.id).length ?? 0
              return (
                <tr key={cat.id} className="hover:bg-surface-alt/50">
                  <td className="mono p-4 text-muted-foreground">#{cat.id}</td>
                  <td className="p-4 font-semibold">{cat.name}</td>
                  <td className="mono p-4">
                    {Number(cat.discountPercent) > 0 ? (
                      <span className="font-medium text-red-deep">{Number(cat.discountPercent)}% off</span>
                    ) : (
                      <span className="text-muted-foreground">0% (Standard)</span>
                    )}
                  </td>
                  <td className="mono p-4">{count} vehicles</td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCategoryModal({ id: cat.id, name: cat.name, discountPercent: Number(cat.discountPercent) })}
                        className={actionBtn}
                      >
                        Edit
                      </button>
                      <button type="button" onClick={() => removeCategory.mutate(cat.id)} className={dangerBtn}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </DataTable>
        </div>
      )}

      {/* TAB 4: COUPONS */}
      {tab === 'coupons' && (
        <div className="mt-8 space-y-6">
          <div className="flex justify-end">
            <Button variant="secondary" onClick={openNewCouponModal}>
              + New Coupon
            </Button>
          </div>

          <DataTable headers={['ID', 'Coupon Code', 'Type', 'Discount', 'Qualification Rule', 'Actions']}>
            {coupons.data?.map((cp: DiscountCoupon) => (
              <tr key={cp.id} className="hover:bg-surface-alt/50">
                <td className="mono p-4 text-muted-foreground">#{cp.id}</td>
                <td className="mono p-4 font-semibold">{cp.code}</td>
                <td className="mono-label p-4">{cp.couponType}</td>
                <td className="mono p-4 font-medium text-red-deep">{Number(cp.discountPercent)}%</td>
                <td className="p-4 text-muted-foreground">
                  {cp.couponType === 'FIRST_RENTAL' && "Customer's first rental only (fixed 50%)"}
                  {cp.couponType === 'EMPLOYEE' && 'Requires Motherson Employee ID'}
                  {cp.couponType === 'DURATION' && `${cp.minDays} to ${cp.maxDays} rental days`}
                </td>
                <td className="p-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCouponModal({
                          id: cp.id,
                          code: cp.code,
                          couponType: cp.couponType,
                          discountPercent: Number(cp.discountPercent),
                          minDays: cp.minDays ? String(cp.minDays) : '',
                          maxDays: cp.maxDays ? String(cp.maxDays) : '',
                        })
                      }
                      className={actionBtn}
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => removeCoupon.mutate(cp.id)} className={dangerBtn}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      {/* TAB 5: CUSTOMERS */}
      {tab === 'customers' && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="search"
              value={custSearch}
              onChange={(e) => setCustSearch(e.target.value)}
              placeholder="Search customers by name, email, or employee ID…"
              className={cn(searchClass, 'sm:max-w-md')}
            />
            <Button
              variant="secondary"
              className="ml-auto"
              onClick={() => setCustomerModal({ name: '', email: '', phone: '', employeeId: '' })}
            >
              + New Customer
            </Button>
          </div>

          <DataTable headers={['ID', 'Name', 'Email', 'Phone', 'Employee ID', 'Role', 'Actions']}>
            {filteredCustomers.map((cust) => (
              <tr key={cust.id} className="hover:bg-surface-alt/50">
                <td className="mono p-4 text-muted-foreground">#{cust.id}</td>
                <td className="p-4 font-semibold">{cust.name}</td>
                <td className="mono p-4 text-xs">{cust.email}</td>
                <td className="mono p-4 text-xs text-muted-foreground">{cust.phone || '—'}</td>
                <td className="mono p-4 text-xs">
                  {cust.employeeId ? <span className="border border-hairline px-2 py-0.5">{cust.employeeId}</span> : '—'}
                </td>
                <td className="mono-label p-4">{cust.role ?? 'CUSTOMER'}</td>
                <td className="p-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button type="button" onClick={() => setHistoryCustomer(cust)} className={actionBtn}>
                      History
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomerModal({
                          id: cust.id,
                          name: cust.name,
                          email: cust.email,
                          phone: cust.phone ?? '',
                          employeeId: cust.employeeId ?? '',
                        })
                      }
                      className={actionBtn}
                    >
                      Edit
                    </button>
                    {cust.role !== 'ADMIN' && (
                      <button type="button" onClick={() => deactivateCustomer.mutate(cust.id)} className={dangerBtn}>
                        Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      {/* SLIDE-OVER SHEET: VEHICLE CREATE / EDIT */}
      <FormSlideOver
        open={!!vehicleModal}
        title={vehicleModal?.id ? `Edit Vehicle #${vehicleModal.id}` : 'Create Vehicle'}
        saveLabel="Save Vehicle"
        pending={saveVehicle.isPending}
        onClose={() => setVehicleModal(null)}
        onSubmit={() => vehicleModal && saveVehicle.mutate(vehicleModal)}
      >
        {vehicleModal && (
          <>
            <Input
              label="Make & Model (e.g. Honda City)"
              value={vehicleModal.name}
              onChange={(e) => setVehicleModal({ ...vehicleModal, name: e.target.value })}
              required
            />
            <Input
              label="Daily Rate (₹)"
              type="number"
              min={1}
              value={vehicleModal.dailyRate}
              onChange={(e) => setVehicleModal({ ...vehicleModal, dailyRate: Number(e.target.value) })}
              required
            />
            <label className="block">
              <span className="mono-label text-muted-foreground">Category</span>
              <select
                value={vehicleModal.categoryId}
                onChange={(e) => setVehicleModal({ ...vehicleModal, categoryId: Number(e.target.value) })}
                className={selectClass}
              >
                {categories.data?.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-card text-ink">
                    {cat.name} ({Number(cat.discountPercent)}% discount)
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-h-11 cursor-pointer items-center justify-between border border-hairline bg-card px-4">
              <span className="text-sm font-medium">Available for rent</span>
              <input
                type="checkbox"
                checked={vehicleModal.available}
                onChange={(e) => setVehicleModal({ ...vehicleModal, available: e.target.checked })}
                className="size-5 accent-[var(--odo-signal)]"
              />
            </label>
          </>
        )}
      </FormSlideOver>

      {/* SLIDE-OVER SHEET: CATEGORY CREATE / EDIT */}
      <FormSlideOver
        open={!!categoryModal}
        title={categoryModal?.id ? `Edit Category #${categoryModal.id}` : 'Create Category'}
        saveLabel="Save Category"
        pending={saveCategory.isPending}
        onClose={() => setCategoryModal(null)}
        onSubmit={() => categoryModal && saveCategory.mutate(categoryModal)}
      >
        {categoryModal && (
          <>
            <Input
              label="Category Name"
              value={categoryModal.name}
              onChange={(e) => setCategoryModal({ ...categoryModal, name: e.target.value })}
              required
            />
            <Input
              label="Category Discount % (0 to 50)"
              type="number"
              min={0}
              max={50}
              value={categoryModal.discountPercent}
              onChange={(e) => setCategoryModal({ ...categoryModal, discountPercent: Number(e.target.value) })}
              required
            />
          </>
        )}
      </FormSlideOver>

      {/* SLIDE-OVER SHEET: COUPON CREATE / EDIT */}
      <FormSlideOver
        open={!!couponModal}
        title={couponModal?.id ? `Edit Coupon #${couponModal.id}` : 'Create Coupon'}
        saveLabel="Save Coupon"
        pending={saveCoupon.isPending}
        onClose={() => setCouponModal(null)}
        onSubmit={() => couponModal && saveCoupon.mutate(couponModal)}
      >
        {couponModal && (
          <>
            <Input
              label="Coupon Code (uppercase)"
              value={couponModal.code}
              onChange={(e) => setCouponModal({ ...couponModal, code: e.target.value.toUpperCase() })}
              required
            />
            <label className="block">
              <span className="mono-label text-muted-foreground">Coupon Type</span>
              <select
                value={couponModal.couponType}
                onChange={(e) => {
                  const nextType = e.target.value as CouponType
                  setCouponModal({
                    ...couponModal,
                    couponType: nextType,
                    discountPercent: nextType === 'FIRST_RENTAL' ? 50 : couponModal.discountPercent,
                  })
                }}
                className={selectClass}
              >
                <option value="FIRST_RENTAL" className="bg-card text-ink">FIRST_RENTAL (Must be 50%)</option>
                <option value="DURATION" className="bg-card text-ink">DURATION (Requires min & max days)</option>
                <option value="EMPLOYEE" className="bg-card text-ink">EMPLOYEE (Motherson staff)</option>
              </select>
            </label>
            <Input
              label="Discount Percent (1 to 50)"
              type="number"
              min={1}
              max={50}
              disabled={couponModal.couponType === 'FIRST_RENTAL'}
              value={couponModal.couponType === 'FIRST_RENTAL' ? 50 : couponModal.discountPercent}
              onChange={(e) => setCouponModal({ ...couponModal, discountPercent: Number(e.target.value) })}
              required
            />
            {couponModal.couponType === 'DURATION' && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min Days (1–30)"
                  type="number"
                  min={1}
                  max={30}
                  value={couponModal.minDays}
                  onChange={(e) => setCouponModal({ ...couponModal, minDays: e.target.value })}
                  required
                />
                <Input
                  label="Max Days (1–30)"
                  type="number"
                  min={1}
                  max={30}
                  value={couponModal.maxDays}
                  onChange={(e) => setCouponModal({ ...couponModal, maxDays: e.target.value })}
                  required
                />
              </div>
            )}
          </>
        )}
      </FormSlideOver>

      {/* SLIDE-OVER SHEET: CUSTOMER CREATE / EDIT */}
      <FormSlideOver
        open={!!customerModal}
        title={customerModal?.id ? `Edit Customer #${customerModal.id}` : 'Create Customer'}
        saveLabel="Save Customer"
        pending={saveCustomer.isPending}
        onClose={() => setCustomerModal(null)}
        onSubmit={() => customerModal && saveCustomer.mutate(customerModal)}
      >
        {customerModal && (
          <>
            <Input
              label="Full Name"
              value={customerModal.name}
              onChange={(e) => setCustomerModal({ ...customerModal, name: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={customerModal.email}
              onChange={(e) => setCustomerModal({ ...customerModal, email: e.target.value })}
              required
            />
            <Input
              label="Phone"
              value={customerModal.phone}
              onChange={(e) => setCustomerModal({ ...customerModal, phone: e.target.value })}
            />
            <Input
              label="Motherson Employee ID (optional)"
              placeholder="MSN…"
              value={customerModal.employeeId}
              onChange={(e) => setCustomerModal({ ...customerModal, employeeId: e.target.value })}
            />
          </>
        )}
      </FormSlideOver>

      {/* SLIDE-OVER SHEET: CUSTOMER RENTAL HISTORY */}
      <SlideOver open={!!historyCustomer} onClose={() => setHistoryCustomer(null)} maxWidth="max-w-lg">
        {historyCustomer && (
          <div>
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div>
                <p className="mono-label text-muted-foreground">Customer Rental History</p>
                <p className="mt-1 text-lg font-semibold">{historyCustomer.name}</p>
                <p className="mono text-xs text-muted-foreground">{historyCustomer.email}</p>
              </div>
              <button type="button" className="mono-label" onClick={() => setHistoryCustomer(null)}>
                Close
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {customerHistoryQuery.isLoading && <p className="mono-label text-muted-foreground">Loading rentals…</p>}
              {customerHistoryQuery.data?.length === 0 && (
                <p className="serif-italic text-2xl text-muted-foreground">No rentals recorded for this customer.</p>
              )}
              {customerHistoryQuery.data?.map((r) => (
                <div key={r.id} className="flex items-center justify-between border border-hairline bg-card p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link to={`/bookings/${r.id}`} className="mono text-xs font-medium hover:underline">
                        {bookingRef(r.id)}
                      </Link>
                      <StatusPill status={r.status === 'ACTIVE' ? 'reserved' : 'available'} />
                    </div>
                    <p className="mt-1 font-semibold">{r.vehicle.name}</p>
                    <p className="mono-label mt-0.5 text-muted-foreground">
                      {prettyDate(r.startDate)} → {prettyDate(r.endDate)} ({r.days}d)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mono font-medium">{formatINR(Number(r.totalAmount))}</p>
                    {r.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => returnRental.mutate(r.id)}
                        className="mono-label mt-2 border border-ink px-2 py-1 text-[10px] hover:bg-ink hover:text-paper"
                      >
                        Return
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  )
}
