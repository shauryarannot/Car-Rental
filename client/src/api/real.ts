import { daysBetween } from '@/lib/trip'
import { http, vehicleToCar } from './http'
import type { Api, AuthResponse, Category, Customer, DiscountCoupon, Rental, Vehicle } from './types'

const json = (method: 'POST' | 'PUT', body: unknown): RequestInit => ({ method, body: JSON.stringify(body) })

/** Real Spring Boot backend with JWT auth and role-based endpoints. */
export const realApi: Api = {
  // Auth
  login: (req) => http<AuthResponse>('/api/auth/login', json('POST', req)),
  register: (req) => http<Customer>('/api/auth/register', json('POST', req)),

  // Browse
  async listCars(f = {}) {
    const path = f.search
      ? `/api/vehicles/search?name=${encodeURIComponent(f.search)}`
      : f.categoryId
        ? `/api/vehicles/category/${f.categoryId}`
        : f.available
          ? '/api/vehicles/available'
          : '/api/vehicles'
    const list = (await http<Vehicle[]>(path)).map(vehicleToCar)
    return list.filter((c) => (!f.available || c.available) && (!f.categoryId || c.category.id === f.categoryId))
  },
  getCar: async (id) => vehicleToCar(await http<Vehicle>(`/api/vehicles/${id}`)),
  listCategories: () => http<Category[]>('/api/categories'),
  listCoupons: () => http<DiscountCoupon[]>('/api/coupons'),

  // Rentals
  async createBooking(req) {
    const days = daysBetween(req.startDate, req.endDate)
    if (days < 1) throw { status: 400, message: 'Return date must be after pick-up.', unreachable: false }

    const q = new URLSearchParams({ vehicleId: String(req.vehicleId), days: String(days) })
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
  createVehicle: async (payload) => vehicleToCar(await http<Vehicle>('/api/vehicles', json('POST', payload))),
  updateVehicle: async (id, payload) => vehicleToCar(await http<Vehicle>(`/api/vehicles/${id}`, json('PUT', payload))),
  deleteVehicle: (id) => http<void>(`/api/vehicles/${id}`, { method: 'DELETE' }),

  // Admin: Categories
  createCategory: (payload) => http<Category>('/api/categories', json('POST', payload)),
  updateCategory: (id, payload) => http<Category>(`/api/categories/${id}`, json('PUT', payload)),
  deleteCategory: (id) => http<void>(`/api/categories/${id}`, { method: 'DELETE' }),

  // Admin: Coupons
  createCoupon: (payload) => http<DiscountCoupon>('/api/coupons', json('POST', payload)),
  updateCoupon: (id, payload) => http<DiscountCoupon>(`/api/coupons/${id}`, json('PUT', payload)),
  deleteCoupon: (id) => http<void>(`/api/coupons/${id}`, { method: 'DELETE' }),

  // Admin: Customers
  listCustomers: () => http<Customer[]>('/api/customers'),
  createCustomer: (payload) => http<Customer>('/api/customers', json('POST', payload)),
  updateCustomer: (id, payload) => http<Customer>(`/api/customers/${id}`, json('PUT', payload)),
  deactivateCustomer: (id) => http<void>(`/api/customers/${id}`, { method: 'DELETE' }),
}
