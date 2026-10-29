import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { vehicleToCar } from './http'
import type { Api, Category, Customer, Rental, Vehicle } from './types'

const cats: Category[] = [
  { id: 1, name: 'Hatchback', discountPercent: 10 },
  { id: 2, name: 'Sedan', discountPercent: 5 },
  { id: 3, name: 'SUV', discountPercent: 0 },
  { id: 4, name: 'Luxury', discountPercent: 0 },
]
const mk = (id: number, name: string, dailyRate: number, c: number, available = true): Vehicle => ({
  id, name, dailyRate, available, category: cats[c - 1],
})
const vehicles: Vehicle[] = [
  mk(1, 'Maruti Swift', 1800, 1),
  mk(2, 'Hyundai i20', 2000, 1),
  mk(3, 'Honda City', 3000, 2),
  mk(4, 'Skoda Slavia', 3200, 2, false),
  mk(5, 'Hyundai Creta', 3800, 3),
  mk(6, 'Mahindra XUV700', 4800, 3),
  mk(7, 'BMW 3 Series', 9500, 4),
  mk(8, 'Mercedes C-Class', 11000, 4),
]
const customers: Customer[] = []
const rentals: Rental[] = []
let rid = 1000

const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 250))
const fail = (status: number, message: string) => ({ status, message, unreachable: false })

/** Same signatures as the real API; mirrors the backend's pricing rules. */
export const mockApi: Api = {
  async listCars(f = {}) {
    let list = vehicles.map(vehicleToCar)
    if (f.available) list = list.filter((c) => c.available)
    if (f.categoryId) list = list.filter((c) => c.category.id === f.categoryId)
    if (f.search) list = list.filter((c) => c.name.toLowerCase().includes(f.search!.toLowerCase()))
    return wait(list)
  },
  async getCar(id) {
    const v = vehicles.find((x) => x.id === id)
    if (!v) throw fail(404, `Vehicle ${id} not found`)
    return wait(vehicleToCar(v))
  },
  listCategories: () => wait(cats),
  async createBooking(req) {
    const days = differenceInCalendarDays(parseISO(req.endDate), parseISO(req.startDate))
    if (days < 1) throw fail(400, 'Return date must be after pick-up.')
    const v = vehicles.find((x) => x.id === req.vehicleId)
    if (!v) throw fail(404, `Vehicle ${req.vehicleId} not found`)
    if (!v.available) throw fail(400, 'Vehicle is not available')
    let customer = customers.find((c) => c.email === req.customer.email)
    if (!customer) {
      customer = { id: customers.length + 1, active: true, ...req.customer }
      customers.push(customer)
    }
    const pct = req.benefit === 'CATEGORY_DISCOUNT' ? v.category.discountPercent : 0
    const today = format(new Date(), 'yyyy-MM-dd')
    const rental: Rental = {
      id: ++rid, customer, vehicle: v, days,
      startDate: today, endDate: format(addDays(new Date(), days), 'yyyy-MM-dd'),
      status: 'ACTIVE', benefitType: req.benefit ?? 'NONE', couponCode: req.couponCode ?? null,
      discountPercent: pct, totalAmount: v.dailyRate * days * (1 - pct / 100),
    }
    rentals.push(rental)
    v.available = false
    return wait(rental)
  },
  listBookings: () => wait([...rentals]),
  async getBooking(id) {
    const r = rentals.find((x) => x.id === id)
    if (!r) throw fail(404, `Rental ${id} not found`)
    return wait(r)
  },
  async cancelBooking(id) {
    const r = rentals.find((x) => x.id === id)
    if (!r) throw fail(404, `Rental ${id} not found`)
    if (r.status === 'COMPLETED') throw fail(400, 'Rental is already completed')
    r.status = 'COMPLETED'
    r.vehicle.available = true
    return wait(r)
  },
  listCoupons: () =>
    wait([
      { id: 1, code: 'WELCOME50', couponType: 'FIRST_RENTAL', discountPercent: 50 },
      { id: 2, code: 'WEEKEND10', couponType: 'DURATION', discountPercent: 10, minDays: 1, maxDays: 3 },
      { id: 3, code: 'MOTHERSON20', couponType: 'EMPLOYEE', discountPercent: 20 },
    ]),
  bookingsByEmail: (email) =>
    wait(rentals.filter((r) => r.customer.email.toLowerCase() === email.trim().toLowerCase())),
}

