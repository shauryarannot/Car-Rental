// Types mirror the Spring Boot entities in server/carrental exactly.
// Money arrives as JSON numbers (BigDecimal), dates as yyyy-MM-dd.

export type RentalStatus = 'ACTIVE' | 'COMPLETED'
export type BenefitType = 'NONE' | 'COUPON' | 'CATEGORY_DISCOUNT' | 'FREE_UPGRADE'
export type CouponType = 'FIRST_RENTAL' | 'DURATION' | 'EMPLOYEE'

export interface Category {
  id: number
  name: string
  discountPercent: number
}

export interface Vehicle {
  id: number
  name: string
  dailyRate: number
  available: boolean
  category: Category
}

export interface Customer {
  id: number
  name: string
  email: string
  phone?: string | null
  employeeId?: string | null
  active: boolean
}

export interface Rental {
  id: number
  customer: Customer
  vehicle: Vehicle
  days: number
  startDate: string
  endDate: string
  status: RentalStatus
  benefitType: BenefitType
  couponCode: string | null
  discountPercent: number | null
  totalAmount: number
}

export interface DiscountCoupon {
  id: number
  code: string
  couponType: CouponType
  discountPercent: number
  minDays?: number | null
  maxDays?: number | null
}

/** Normalised error shape used everywhere in the UI. */
export interface ApiError {
  status: number // 0 = network failure / backend unreachable
  message: string
  unreachable: boolean
}

/** View model the design works with. Derived from Vehicle, never invented. */
export interface Car {
  id: number
  make: string
  model: string
  name: string
  pricePerDay: number
  available: boolean
  category: Category
  // Not provided by the backend yet. Optional so UI can omit them cleanly.
  imageUrl?: string
  seats?: number
  transmission?: string
  fuelType?: string
  year?: number
}

export interface BookingRequest {
  vehicleId: number
  customer: { name: string; email: string; phone?: string; employeeId?: string }
  startDate: string
  endDate: string
  benefit?: BenefitType
  couponCode?: string
}

export interface CarFilters {
  available?: boolean
  categoryId?: number
  search?: string
}

/** The one interface both the real backend and the mock implement. */
export interface Api {
  listCars(filters?: CarFilters): Promise<Car[]>
  getCar(id: number): Promise<Car>
  listCategories(): Promise<Category[]>
  createBooking(req: BookingRequest): Promise<Rental>
  listBookings(): Promise<Rental[]>
  getBooking(id: number): Promise<Rental>
  /** Backend has no cancel; this maps to PUT /rentals/{id}/return. */
  cancelBooking(id: number): Promise<Rental>
  listCoupons(): Promise<DiscountCoupon[]>
  listCustomers(): Promise<Customer[]>
  /** No auth yet: bookings are looked up by the email used to book. */
  bookingsByEmail(email: string): Promise<Rental[]>
}

