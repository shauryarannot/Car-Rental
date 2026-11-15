const DAY_MS = 86_400_000
const shortDate = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })

const toLocalMidnight = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const toIsoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** The backend always starts a rental today and accepts 1–30 days. */
export const MAX_DAYS = 30
export const DURATION_DAYS = Array.from({ length: MAX_DAYS }, (_, i) => i + 1)

export const today = () => toIsoDate(new Date())
export const returnDateFor = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}
export const daysBetween = (startIso, endIso) =>
  Math.round((toLocalMidnight(endIso).getTime() - toLocalMidnight(startIso).getTime()) / DAY_MS)
export const daysUntil = (iso) => daysBetween(today(), iso)
export const clampDays = (n) => Math.min(MAX_DAYS, Math.max(1, Math.round(n) || 1))
export const prettyDate = (iso) => shortDate.format(toLocalMidnight(iso))
