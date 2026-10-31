// Types mirror the Spring Boot entities and DTOs in server/carrental.

export type RentalStatus = 'ACTIVE' | 'COMPLETED'
export type BenefitType = 'NONE' | 'COUPON' | 'CATEGORY_DISCOUNT' | 'FREE_UPGRADE'
export type CouponType = 'FIRST_RENTAL' | 'DURATION' | 'EMPLOYEE'
export type Role = 'ADMIN' | 'CUSTOMER'

export interface AuthResponse {
  token: string
  role: Role
  customerId: number
  name: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  phone?: string
  employeeId?: string
}

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
  role?: Role
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

/** View model the design works with. Derived from Vehicle. */
export interface Car {
  id: number
  make: string
  model: string
  name: string
  pricePerDay: number
  available: boolean
  category: Category
  imageUrl?: string
}

export interface BookingRequest {
  vehicleId: number
  startDate: string
  endDate: string
  benefit?: BenefitType
  couponCode?: string
}

export interface VehiclePayload {
  name: string
  dailyRate: number
  available: boolean
  category: { id: number }
}

export interface CategoryPayload {
  name: string
  discountPercent: number
}

export interface CouponPayload {
  code: string
  couponType: CouponType
  discountPercent: number
  minDays?: number | null
  maxDays?: number | null
}

export interface CustomerPayload {
  name: string
  email: string
  phone?: string | null
  employeeId?: string | null
}

export interface CarFilters {
  available?: boolean
  categoryId?: number
  search?: string
}

/** The single interface both the real backend and the mock implement. */
export interface Api {
  // Auth (public)
  login(req: LoginRequest): Promise<AuthResponse>
  register(req: RegisterRequest): Promise<Customer>

  // Browse (authenticated)
  listCars(filters?: CarFilters): Promise<Car[]>
  getCar(id: number): Promise<Car>
  listCategories(): Promise<Category[]>
  listCoupons(): Promise<DiscountCoupon[]>

  // Rentals (customer & admin)
  createBooking(req: BookingRequest): Promise<Rental>
  myBookings(): Promise<Rental[]>
  getBooking(id: number): Promise<Rental>
  cancelBooking(id: number): Promise<Rental>
  listBookings(): Promise<Rental[]>
  customerBookings(customerId: number): Promise<Rental[]>

  // Admin CRUD: Vehicles
  createVehicle(payload: VehiclePayload): Promise<Car>
  updateVehicle(id: number, payload: VehiclePayload): Promise<Car>
  deleteVehicle(id: number): Promise<void>

  // Admin CRUD: Categories
  createCategory(payload: CategoryPayload): Promise<Category>
  updateCategory(id: number, payload: CategoryPayload): Promise<Category>
  deleteCategory(id: number): Promise<void>

  // Admin CRUD: Coupons
  createCoupon(payload: CouponPayload): Promise<DiscountCoupon>
  updateCoupon(id: number, payload: CouponPayload): Promise<DiscountCoupon>
  deleteCoupon(id: number): Promise<void>

  // Admin CRUD: Customers
  listCustomers(): Promise<Customer[]>
  createCustomer(payload: CustomerPayload): Promise<Customer>
  updateCustomer(id: number, payload: CustomerPayload): Promise<Customer>
  deactivateCustomer(id: number): Promise<void>
}
