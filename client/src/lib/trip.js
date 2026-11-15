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
