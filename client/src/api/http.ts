import type { ApiError, Car, Vehicle } from './types'
import { carImage } from '@/lib/carImages'

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

/** Single place every backend call goes through. Always rejects with ApiError. */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw { status: 0, message: 'The garage is closed. Try again.', unreachable: true } satisfies ApiError
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.error) message = String(body.error)
    } catch {
      /* non-JSON error body */
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

