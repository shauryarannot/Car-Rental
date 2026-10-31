import { differenceInCalendarDays, parseISO } from 'date-fns'
import { http, vehicleToCar } from './http'
import type { Api, AuthResponse, Category, Customer, DiscountCoupon, Rental, Vehicle } from './types'

/** Real Spring Boot backend with JWT auth and role-based endpoints. */
export const realApi: Api = {
  // Auth
  login: (req) => http<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(req) }),
  register: (req) => http<Customer>('/api/auth/register', { method: 'POST', body: JSON.stringify(req) }),

  // Browse
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
  listCoupons: () => http<DiscountCoupon[]>('/api/coupons'),

  // Rentals
  async createBooking(req) {
    const days = differenceInCalendarDays(parseISO(req.endDate), parseISO(req.startDate))
    if (days < 1) throw { status: 400, message: 'Return date must be after pick-up.', unreachable: false }

    const q = new URLSearchParams({
      vehicleId: String(req.vehicleId),
      days: String(days),
    })
    if (req.benefit && req.benefit !== 'NONE') q.set('benefit', req.benefit)
    if (req.couponCode) q.set('couponCode', req.couponCode)
    return http<Rental>(`/api/rentals?${q}`, { method: 'POST' })
  },
  myBookings: () => http<Rental[]>('/api/rentals/my'),
  getBooking: (id) => http<Rental>(`/api/rentals/${id}`),
  cancelBooking: (id) => http<Rental>(`/api/rentals/${id}/return`, { method: 'PUT' }),
  listBookings: () => http<Rental[]>('/api/rentals'),
  customerBookings: (customerId) => http<Rental[]>(`/api/rentals/customer/${customerId}`),

  // Admin: Vehicles
  async createVehicle(payload) {
    return vehicleToCar(await http<Vehicle>('/api/vehicles', { method: 'POST', body: JSON.stringify(payload) }))
  },
  async updateVehicle(id, payload) {
    return vehicleToCar(await http<Vehicle>(`/api/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(payload) }))
  },
  deleteVehicle: (id) => http<void>(`/api/vehicles/${id}`, { method: 'DELETE' }),

  // Admin: Categories
  createCategory: (payload) => http<Category>('/api/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id, payload) => http<Category>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (id) => http<void>(`/api/categories/${id}`, { method: 'DELETE' }),

  // Admin: Coupons
  createCoupon: (payload) => http<DiscountCoupon>('/api/coupons', { method: 'POST', body: JSON.stringify(payload) }),
  updateCoupon: (id, payload) => http<DiscountCoupon>(`/api/coupons/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCoupon: (id) => http<void>(`/api/coupons/${id}`, { method: 'DELETE' }),

  // Admin: Customers
  listCustomers: () => http<Customer[]>('/api/customers'),
  createCustomer: (payload) => http<Customer>('/api/customers', { method: 'POST', body: JSON.stringify(payload) }),
  updateCustomer: (id, payload) => http<Customer>(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deactivateCustomer: (id) => http<void>(`/api/customers/${id}`, { method: 'DELETE' }),
}
