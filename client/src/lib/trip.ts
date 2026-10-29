import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'

/** The backend always starts a rental today and accepts 1–30 days. */
export const MAX_DAYS = 30
export const today = () => format(new Date(), 'yyyy-MM-dd')
export const returnDateFor = (days: number) => format(addDays(new Date(), days), 'yyyy-MM-dd')
export const daysUntil = (iso: string) => differenceInCalendarDays(parseISO(iso), new Date())
export const clampDays = (n: number) => Math.min(MAX_DAYS, Math.max(1, Math.round(n) || 1))
export const prettyDate = (iso: string) => format(parseISO(iso), 'EEE, dd MMM')

