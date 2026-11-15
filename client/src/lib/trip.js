const DAY_MS = 86_400_000
const shortDate = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })

const toLocalMidnight = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const toIsoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** The backend accepts 1–30 rental days and a pick-up date up to 30 days ahead. */
export const MAX_DAYS = 30
export const MAX_ADVANCE_DAYS = 30
export const DURATION_DAYS = Array.from({ length: MAX_DAYS }, (_, i) => i + 1)

export const today = () => toIsoDate(new Date())

export const addDays = (iso, days) => {
  const d = toLocalMidnight(iso)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

export const maxStartDate = () => addDays(today(), MAX_ADVANCE_DAYS)

export const clampStartDate = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return today()
  const min = today()
  const max = maxStartDate()
  if (iso < min) return min
  if (iso > max) return max
  return iso
}

export const returnDateFor = (days, startIso = today()) => addDays(clampStartDate(startIso), days)

export const daysBetween = (startIso, endIso) =>
  Math.round((toLocalMidnight(endIso).getTime() - toLocalMidnight(startIso).getTime()) / DAY_MS)

export const daysUntil = (iso, startIso = today()) => daysBetween(clampStartDate(startIso), iso)

export const clampDays = (n) => Math.min(MAX_DAYS, Math.max(1, Math.round(n) || 1))

export const prettyDate = (iso) => shortDate.format(toLocalMidnight(iso))

/** Check whether an ISO YYYY-MM-DD date string represents a real calendar date. */
export function isValidIsoDate(iso) {
  if (!iso || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(iso)) return false
  const [y, m, d] = iso.split('-').map(Number)
  if (m < 1 || m > 12 || d < 1 || d > 31) return false
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

/**
 * Validate a date string against [min, max] bounds.
 * Returns null if valid, or a clear error message if invalid.
 */
export function validateDateRange(iso, min = today(), max = maxStartDate(), label = 'Pick-up date') {
  if (!iso) return `${label} is required.`
  if (!isValidIsoDate(iso)) return `Enter a valid ${label.toLowerCase()} (YYYY-MM-DD).`
  if (iso < min) {
    return min === today()
      ? 'Previous dates cannot be selected. Choose today or a future date.'
      : `${label} cannot be earlier than ${prettyDate(min)}.`
  }
  if (max && iso > max) {
    return `${label} cannot be later than ${prettyDate(max)}.`
  }
  return null
}

