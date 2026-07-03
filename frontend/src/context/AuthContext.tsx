import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi } from '../api'
import type { User, Role } from '../types'

interface AuthCtx {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (b: { name: string; email: string; password: string; role: Role }) => Promise<User>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx>(null!)

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login: AuthCtx['login'] = async (email, password) => {
    const u = await authApi.login({ email, password })
    setUser(u)
    return u
  }

  const register: AuthCtx['register'] = async (b) => {
    const u = await authApi.register(b)
    setUser(u)
    return u
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
  }

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>
  )
}
