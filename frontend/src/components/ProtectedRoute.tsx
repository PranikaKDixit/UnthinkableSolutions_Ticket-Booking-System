import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './ui'
import type { Role } from '../types'

/**
 * Guards a route. If `roles` is given, the user must hold one of them.
 * Unauthenticated users go to /login (preserving intended destination).
 */
export function ProtectedRoute({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner label="Loading…" />

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
