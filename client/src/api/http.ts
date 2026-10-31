import type { ApiError, Car, Vehicle } from './types'
import { carImage } from '@/lib/carImages'
import { getAuthToken } from '@/app/auth'

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

/** Single place every backend call goes through. Attaches Bearer JWT and normalises errors. */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers,
    })
  } catch {
    throw { status: 0, message: 'The garage is closed. Try again.', unreachable: true } satisfies ApiError
  }

  if (!res.ok) {
    let message =
      res.status === 401
        ? 'Invalid email or password, or your session expired.'
        : res.status === 403
          ? 'You do not have permission for this action.'
          : `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.error) message = String(body.error)
      else if (body?.message) message = String(body.message)
    } catch {
      /* non-JSON error body */
    }
    if (res.status === 401 && !path.startsWith('/api/auth/')) {
      window.dispatchEvent(new Event('odo:unauthorized'))
    }
    throw { status: res.status, message, unreachable: res.status >= 502 } satisfies ApiError
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'status' in e && 'message' in e
}

/** Backend only has `name`; first word is the make, the rest is the model. */
export function vehicleToCar(v: Vehicle): Car {
  const [make, ...rest] = v.name.trim().split(/\s+/)
  return {
    id: v.id,
    make,
    model: rest.join(' ') || make,
    name: v.name,
    pricePerDay: Number(v.dailyRate),
    available: v.available,
    category: v.category,
    imageUrl: carImage(v.name),
  }
}
