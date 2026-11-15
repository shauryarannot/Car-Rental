import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...i) => twMerge(clsx(i))

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
/** ₹ 3,500 with lakh grouping. */
export const formatINR = (n) => `₹ ${inr.format(Math.round(n))}`

export const bookingRef = (id) => `Ryde.exe-${String(id).padStart(6, '0')}`
