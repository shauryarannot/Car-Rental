import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AuthResponse, Role } from '@/api/types'

export interface AuthUser {
  token: string
  role: Role
  customerId: number
  name: string
  email: string
  employeeId?: string
}

interface AuthContextValue {
  user: AuthUser | null
  isAdmin: boolean
  isCustomer: boolean
  isEmployee: boolean
  login: (res: AuthResponse, email: string, employeeId?: string) => void
  logout: () => void
}

const STORAGE_KEY = 'odo-auth'
const EMPLOYEE_MAP_KEY = 'odo-employee-directory'

function readEmployeeDirectory(): Record<string, string> {
  try {
    const raw = localStorage.getItem(EMPLOYEE_MAP_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function rememberEmployee(email: string, employeeId?: string) {
  const cleanId = employeeId?.trim()
  if (!cleanId) return
  try {
    const map = readEmployeeDirectory()
    map[email.trim().toLowerCase()] = cleanId
    localStorage.setItem(EMPLOYEE_MAP_KEY, JSON.stringify(map))
  } catch {
    // Ignore storage quota errors
  }
}

function isMothersonEmployee(user: AuthUser | null): boolean {
  if (!user || user.role !== 'CUSTOMER') return false
  const normalizedEmail = user.email.trim().toLowerCase()
  if (normalizedEmail.endsWith('@motherson.com')) return true
  if (user.employeeId?.trim()) return true
  return Boolean(readEmployeeDirectory()[normalizedEmail])
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (!parsed?.token || !parsed?.role) return null
    return parsed
  } catch {
    return null
  }
}

export function getAuthToken(): string | null {
  return readStoredUser()?.token ?? null
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  isCustomer: false,
  isEmployee: false,
  login: () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)
  const queryClient = useQueryClient()

  /** Drops everything that belongs to the previous session: cached API data, in-flight requests and toasts. */
  const resetSession = useCallback(() => {
    queryClient.cancelQueries()
    queryClient.clear()
    toast.dismiss()
  }, [queryClient])

  const login = useCallback(
    (res: AuthResponse, email: string, employeeId?: string) => {
      rememberEmployee(email, employeeId)
      const resolvedEmployeeId = employeeId?.trim() || readEmployeeDirectory()[email.trim().toLowerCase()]
      const next: AuthUser = {
        token: res.token,
        role: res.role,
        customerId: res.customerId,
        name: res.name,
        email,
        ...(resolvedEmployeeId ? { employeeId: resolvedEmployeeId } : {}),
      }
      resetSession()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setUser(next)
    },
    [resetSession],
  )

  const logout = useCallback(() => {
    resetSession()
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [resetSession])

  useEffect(() => {
    const onUnauthorized = () => logout()
    // Keep every tab in sync when another tab signs in, signs out or switches account.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      resetSession()
      setUser(readStoredUser())
    }
    window.addEventListener('odo:unauthorized', onUnauthorized)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('odo:unauthorized', onUnauthorized)
      window.removeEventListener('storage', onStorage)
    }
  }, [logout, resetSession])

  const value = useMemo(
    () => ({
      user,
      isAdmin: user?.role === 'ADMIN',
      isCustomer: user?.role === 'CUSTOMER',
      isEmployee: isMothersonEmployee(user),
      login,
      logout,
    }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
