import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { normalizeEmail } from '@/lib/utils'

const STORAGE_KEY = 'odo-auth'
const EMPLOYEE_MAP_KEY = 'odo-employee-directory'

function readEmployeeDirectory() {
  try {
    const raw = localStorage.getItem(EMPLOYEE_MAP_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function rememberEmployee(email, employeeId) {
  const cleanId = employeeId?.trim()
  const cleanEmail = normalizeEmail(email)
  if (!cleanId || !cleanEmail) return
  try {
    const map = readEmployeeDirectory()
    map[cleanEmail] = cleanId
    localStorage.setItem(EMPLOYEE_MAP_KEY, JSON.stringify(map))
  } catch {
    // Ignore storage quota errors
  }
}

function isMothersonEmployee(user) {
  if (!user || user.role !== 'CUSTOMER') return false
  const normalizedEmail = normalizeEmail(user.email)
  if (normalizedEmail.endsWith('@motherson.com')) return true
  if (user.employeeId?.trim()) return true
  return Boolean(readEmployeeDirectory()[normalizedEmail])
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.token || !parsed?.role) return null
    return {
      ...parsed,
      email: normalizeEmail(parsed.email),
    }
  } catch {
    return null
  }
}


export function getAuthToken() {
  return readStoredUser()?.token ?? null
}

const AuthContext = createContext({
  user: null,
  isAdmin: false,
  isCustomer: false,
  isEmployee: false,
  login: () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const queryClient = useQueryClient()

  /** Drops everything that belongs to the previous session: cached API data, in-flight requests and toasts. */
  const resetSession = useCallback(() => {
    queryClient.cancelQueries()
    queryClient.clear()
    toast.dismiss()
  }, [queryClient])

  const login = useCallback(
    (res, email, employeeId) => {
      const normalizedEmail = normalizeEmail(email)
      rememberEmployee(normalizedEmail, employeeId)
      const resolvedEmployeeId = employeeId?.trim() || readEmployeeDirectory()[normalizedEmail]
      const next = {
        token: res.token,
        role: res.role,
        customerId: res.customerId,
        name: res.name,
        email: normalizedEmail,
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
    const onStorage = (e) => {
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
