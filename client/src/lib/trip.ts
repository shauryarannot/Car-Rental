const DAY_MS = 86_400_000
const shortDate = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })

const toLocalMidnight = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** The backend always starts a rental today and accepts 1–30 days. */
export const MAX_DAYS = 30
export const DURATION_DAYS = Array.from({ length: MAX_DAYS }, (_, i) => i + 1)

export const today = () => toIsoDate(new Date())
export const returnDateFor = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}
export const daysBetween = (startIso: string, endIso: string) =>
  Math.round((toLocalMidnight(endIso).getTime() - toLocalMidnight(startIso).getTime()) / DAY_MS)
export const daysUntil = (iso: string) => daysBetween(today(), iso)
export const clampDays = (n: number) => Math.min(MAX_DAYS, Math.max(1, Math.round(n) || 1))
export const prettyDate = (iso: string) => shortDate.format(toLocalMidnight(iso))

