import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { vehicleToCar } from './http'
import type { Api, Category, Customer, DiscountCoupon, Rental, Vehicle } from './types'

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
const customers: Customer[] = [
  { id: 1, name: 'Admin', email: 'admin@carrental.com', active: true, role: 'ADMIN' },
  { id: 2, name: 'Aarav Sharma', email: 'customer@carrental.com', phone: '+91 9810010001', active: true, role: 'CUSTOMER' },
  { id: 3, name: 'Priya Nair', email: 'employee@motherson.com', phone: '+91 9810010002', employeeId: 'MSN10000', active: true, role: 'CUSTOMER' },
]
const coupons: DiscountCoupon[] = [
  { id: 1, code: 'WELCOME50', couponType: 'FIRST_RENTAL', discountPercent: 50 },
  { id: 2, code: 'WEEKEND10', couponType: 'DURATION', discountPercent: 10, minDays: 1, maxDays: 3 },
  { id: 3, code: 'MOTHERSON20', couponType: 'EMPLOYEE', discountPercent: 20 },
]
const rentals: Rental[] = []
let rid = 1000

const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 150))
const fail = (status: number, message: string) => ({ status, message, unreachable: false })

export const mockApi: Api = {
  async login(req) {
    const c = customers.find((x) => x.email.toLowerCase() === req.email.toLowerCase() && x.active)
    if (!c) throw fail(401, 'Invalid email or password')
    return wait({ token: 'mock-jwt-token', role: c.role ?? 'CUSTOMER', customerId: c.id, name: c.name })
  },
  async register(req) {
    if (customers.some((x) => x.email.toLowerCase() === req.email.toLowerCase())) {
      throw fail(400, 'Email is already registered')
    }
    const c: Customer = {
      id: customers.length + 1,
      name: req.name,
      email: req.email,
      phone: req.phone,
      employeeId: req.employeeId,
      active: true,
      role: 'CUSTOMER',
    }
    customers.push(c)
    return wait(c)
  },
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
  listCategories: () => wait([...cats]),
  listCoupons: () => wait([...coupons]),
  async createBooking(req) {
    const days = differenceInCalendarDays(parseISO(req.endDate), parseISO(req.startDate))
    if (days < 1) throw fail(400, 'Return date must be after pick-up.')
    const v = vehicles.find((x) => x.id === req.vehicleId)
    if (!v) throw fail(404, `Vehicle ${req.vehicleId} not found`)
    if (!v.available) throw fail(400, 'Vehicle is not available')
    const customer = customers[1]
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
  myBookings: () => wait([...rentals]),
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
  listBookings: () => wait([...rentals]),
  customerBookings: (customerId) => wait(rentals.filter((r) => r.customer.id === customerId)),
  async createVehicle(p) {
    const cat = cats.find((c) => c.id === p.category.id) ?? cats[0]
    const v: Vehicle = { id: vehicles.length + 1, name: p.name, dailyRate: p.dailyRate, available: p.available, category: cat }
    vehicles.push(v)
    return wait(vehicleToCar(v))
  },
  async updateVehicle(id, p) {
    const v = vehicles.find((x) => x.id === id)
    if (!v) throw fail(404, 'Vehicle not found')
    v.name = p.name
    v.dailyRate = p.dailyRate
    v.available = p.available
    v.category = cats.find((c) => c.id === p.category.id) ?? v.category
    return wait(vehicleToCar(v))
  },
  async deleteVehicle(id) {
    const idx = vehicles.findIndex((x) => x.id === id)
    if (idx >= 0) vehicles.splice(idx, 1)
    return wait(undefined)
  },
  async createCategory(p) {
    const c: Category = { id: cats.length + 1, name: p.name, discountPercent: p.discountPercent }
    cats.push(c)
    return wait(c)
  },
  async updateCategory(id, p) {
    const c = cats.find((x) => x.id === id)
    if (!c) throw fail(404, 'Category not found')
    c.name = p.name
    c.discountPercent = p.discountPercent
    return wait(c)
  },
  async deleteCategory(id) {
    const idx = cats.findIndex((x) => x.id === id)
    if (idx >= 0) cats.splice(idx, 1)
    return wait(undefined)
  },
  async createCoupon(p) {
    const c: DiscountCoupon = { id: coupons.length + 1, ...p }
    coupons.push(c)
    return wait(c)
  },
  async updateCoupon(id, p) {
    const c = coupons.find((x) => x.id === id)
    if (!c) throw fail(404, 'Coupon not found')
    Object.assign(c, p)
    return wait(c)
  },
  async deleteCoupon(id) {
    const idx = coupons.findIndex((x) => x.id === id)
    if (idx >= 0) coupons.splice(idx, 1)
    return wait(undefined)
  },
  listCustomers: () => wait(customers.filter((c) => c.active)),
  async createCustomer(p) {
    const c: Customer = { id: customers.length + 1, ...p, active: true, role: 'CUSTOMER' }
    customers.push(c)
    return wait(c)
  },
  async updateCustomer(id, p) {
    const c = customers.find((x) => x.id === id)
    if (!c) throw fail(404, 'Customer not found')
    Object.assign(c, p)
    return wait(c)
  },
  async deactivateCustomer(id) {
    const c = customers.find((x) => x.id === id)
    if (c) c.active = false
    return wait(undefined)
  },
}
