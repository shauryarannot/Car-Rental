import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...i: ClassValue[]) => twMerge(clsx(i))

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
/** ₹ 3,500 with lakh grouping. */
export const formatINR = (n: number) => `₹ ${inr.format(Math.round(n))}`

export const bookingRef = (id: number) => `Ryde.exe-${String(id).padStart(6, '0')}`
