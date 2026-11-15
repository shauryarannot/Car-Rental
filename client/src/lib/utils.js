import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...i) => twMerge(clsx(i))

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
/** ₹ 3,500 with lakh grouping. */
export const formatINR = (n) => `₹ ${inr.format(Math.round(n))}`

export const bookingRef = (id) => `Ryde.exe-${String(id).padStart(6, '0')}`

/** Normalize an email address for case-insensitive storage, lookup, and comparison. */
export const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase()

const STRICT_EMAIL_RE = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/

/**
 * Validate an email address on the client before making API requests.
 * Returns null when valid, or a user-facing error message when invalid.
 */
export function validateEmail(email) {
  const clean = String(email ?? '').trim()
  if (!clean) return 'Email address is required.'
  if (clean.includes('..') || clean.startsWith('.') || clean.includes('.@') || !STRICT_EMAIL_RE.test(clean)) {
    return 'Enter a valid email address (for example, name@example.com).'
  }
  return null
}

