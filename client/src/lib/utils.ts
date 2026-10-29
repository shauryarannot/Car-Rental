import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export const cn = (...i: ClassValue[]) => twMerge(clsx(i))

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
/** ₹ 3,500 with lakh grouping. */
export const formatINR = (n: number) => `₹ ${inr.format(Math.round(n))}`
export const formatDate = (iso: string) => format(parseISO(iso), 'dd MMM yyyy')
export const pad = (n: number, w = 2) => String(n).padStart(w, '0')

