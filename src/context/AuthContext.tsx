import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { callGet, frappeCall } from '../api/client'

export interface CustomerInfo {
  name: string
  customer_name: string
  kyc_status: string
  phone: string
}

interface User {
  user: string
  name: string
  roles: string[]
  customer: CustomerInfo | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isLoggedIn: boolean
  isStaff: boolean
  checkSession: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkSession = useCallback(async () => {
    try {
      const data = await callGet<User>('auth.get_current_user')
      if (data && data.user !== 'Guest') {
        setUser(data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const logout = async () => {
    try {
      await frappeCall('frappe.auth.logout')
    } catch {
      // ignore
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggedIn: !!user,
        isStaff: user?.roles?.some((r) => ['System Manager', 'Hub Manager', 'Hub Staff'].includes(r)) ?? false,
        checkSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
