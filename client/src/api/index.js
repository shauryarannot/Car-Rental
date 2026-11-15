import { daysBetween } from '@/lib/trip'
import { http, isApiError, vehicleToCar } from './http'

const json = (method, body) => ({ method, body: JSON.stringify(body) })

export { isApiError }

/** Spring Boot backend client with JWT auth and role-based endpoints. */
export const api = {
  // Auth
  login: (req) => http('/api/auth/login', json('POST', req)),
  register: (req) => http('/api/auth/register', json('POST', req)),

  // Browse
  async listCars(f = {}) {
    const path = f.search
      ? `/api/vehicles/search?name=${encodeURIComponent(f.search)}`
      : f.categoryId
        ? `/api/vehicles/category/${f.categoryId}`
        : f.available
          ? '/api/vehicles/available'
          : '/api/vehicles'
    const list = (await http(path)).map(vehicleToCar)
    return list.filter((c) => (!f.available || c.available) && (!f.categoryId || c.category.id === f.categoryId))
  },
  getCar: async (id) => vehicleToCar(await http(`/api/vehicles/${id}`)),
  listCategories: () => http('/api/categories'),
  listCoupons: () => http('/api/coupons'),

  // Rentals
  async createBooking(req) {
    const days = daysBetween(req.startDate, req.endDate)
    if (days < 1) throw { status: 400, message: 'Return date must be after pick-up.', unreachable: false }

    const q = new URLSearchParams({ vehicleId: String(req.vehicleId), days: String(days) })
    if (req.benefit && req.benefit !== 'NONE') q.set('benefit', req.benefit)
    if (req.couponCode) q.set('couponCode', req.couponCode)
    return http(`/api/rentals?${q}`, { method: 'POST' })
  },
  myBookings: () => http('/api/rentals/my'),
  getBooking: (id) => http(`/api/rentals/${id}`),
  cancelBooking: (id) => http(`/api/rentals/${id}/return`, { method: 'PUT' }),
  listBookings: () => http('/api/rentals'),
  customerBookings: (customerId) => http(`/api/rentals/customer/${customerId}`),

  // Admin: Vehicles
  createVehicle: async (payload) => vehicleToCar(await http('/api/vehicles', json('POST', payload))),
  updateVehicle: async (id, payload) => vehicleToCar(await http(`/api/vehicles/${id}`, json('PUT', payload))),
  deleteVehicle: (id) => http(`/api/vehicles/${id}`, { method: 'DELETE' }),

  // Admin: Categories
  createCategory: (payload) => http('/api/categories', json('POST', payload)),
  updateCategory: (id, payload) => http(`/api/categories/${id}`, json('PUT', payload)),
  deleteCategory: (id) => http(`/api/categories/${id}`, { method: 'DELETE' }),

  // Admin: Coupons
  createCoupon: (payload) => http('/api/coupons', json('POST', payload)),
  updateCoupon: (id, payload) => http(`/api/coupons/${id}`, json('PUT', payload)),
  deleteCoupon: (id) => http(`/api/coupons/${id}`, { method: 'DELETE' }),

  // Admin: Customers
  listCustomers: () => http('/api/customers'),
  createCustomer: (payload) => http('/api/customers', json('POST', payload)),
  updateCustomer: (id, payload) => http(`/api/customers/${id}`, json('PUT', payload)),
  deactivateCustomer: (id) => http(`/api/customers/${id}`, { method: 'DELETE' }),
}
