import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthResponse, Role } from '@/api/types'

export interface AuthUser {
  token: string
  role: Role
  customerId: number
  name: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  isAdmin: boolean
  isCustomer: boolean
  login: (res: AuthResponse, email: string) => void
  logout: () => void
}

const STORAGE_KEY = 'odo-auth'

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
  login: () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)

  const login = useCallback((res: AuthResponse, email: string) => {
    const next: AuthUser = {
      token: res.token,
      role: res.role,
      customerId: res.customerId,
      name: res.name,
      email,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    localStorage.setItem('odo-email', email)
    setUser(next)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    const onUnauthorized = () => logout()
    window.addEventListener('odo:unauthorized', onUnauthorized)
    return () => window.removeEventListener('odo:unauthorized', onUnauthorized)
  }, [logout])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'ADMIN',
        isCustomer: user?.role === 'CUSTOMER',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

