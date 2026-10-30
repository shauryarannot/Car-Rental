import { differenceInCalendarDays, parseISO } from 'date-fns'
import { http, vehicleToCar } from './http'
import type { Api, Category, Customer, DiscountCoupon, Rental, Vehicle } from './types'

/** Real backend. Endpoints: /api/vehicles, /api/categories, /api/customers, /api/rentals. */
export const realApi: Api = {
  async listCars(f = {}) {
    let path = '/api/vehicles'
    if (f.search) path = `/api/vehicles/search?name=${encodeURIComponent(f.search)}`
    else if (f.categoryId) path = `/api/vehicles/category/${f.categoryId}`
    else if (f.available) path = '/api/vehicles/available'
    let list = (await http<Vehicle[]>(path)).map(vehicleToCar)
    if (f.available) list = list.filter((c) => c.available)
    if (f.categoryId) list = list.filter((c) => c.category.id === f.categoryId)
    return list
  },
  async getCar(id) {
    return vehicleToCar(await http<Vehicle>(`/api/vehicles/${id}`))
  },
  listCategories: () => http<Category[]>('/api/categories'),

  async createBooking(req) {
    const days = differenceInCalendarDays(parseISO(req.endDate), parseISO(req.startDate))
    if (days < 1) throw { status: 400, message: 'Return date must be after pick-up.', unreachable: false }

    // No auth yet: find the customer by email, otherwise register them.
    const all = await http<Customer[]>('/api/customers')
    let customer = all.find((c) => c.email.toLowerCase() === req.customer.email.toLowerCase())
    if (!customer) {
      customer = await http<Customer>('/api/customers', {
        method: 'POST',
        body: JSON.stringify({ ...req.customer, active: true }),
      })
    }
    const q = new URLSearchParams({
      customerId: String(customer.id),
      vehicleId: String(req.vehicleId),
      days: String(days),
    })
    if (req.benefit && req.benefit !== 'NONE') q.set('benefit', req.benefit)
    if (req.couponCode) q.set('couponCode', req.couponCode)
    return http<Rental>(`/api/rentals?${q}`, { method: 'POST' })
  },
  listBookings: () => http<Rental[]>('/api/rentals'),
  getBooking: (id) => http<Rental>(`/api/rentals/${id}`),
  cancelBooking: (id) => http<Rental>(`/api/rentals/${id}/return`, { method: 'PUT' }),
  listCoupons: () => http<DiscountCoupon[]>('/api/coupons'),
  listCustomers: () => http<Customer[]>('/api/customers'),
  async bookingsByEmail(email) {
    const all = await http<Customer[]>('/api/customers')
    const c = all.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
    if (!c) return []
    return http<Rental[]>(`/api/rentals/customer/${c.id}`)
  },
}

