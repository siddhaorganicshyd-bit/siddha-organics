import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/index.js'

/**
 * Protects routes that require an authenticated user (role = 'user' or any authenticated user).
 * Redirects to /login with a returnUrl query param if not authenticated.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, currentUser } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || currentUser?.role !== 'user') {
    const returnUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />
  }

  return <Outlet />
}
