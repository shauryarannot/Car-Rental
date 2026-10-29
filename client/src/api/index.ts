import { mockApi } from './mock'
import { realApi } from './real'

/** Flip VITE_USE_MOCK=true to run without the backend. This is the only switch. */
export const api = import.meta.env.VITE_USE_MOCK === 'true' ? mockApi : realApi
export * from './types'
export { isApiError } from './http'

