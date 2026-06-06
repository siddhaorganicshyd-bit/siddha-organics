import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/index.js'

/**
 * Protects routes that require an authenticated admin (role = 'admin').
 * Redirects to /admin/login if not authenticated or not an admin.
 */
export default function AdminProtectedRoute() {
  const { isAuthenticated, currentUser } = useAuth()

  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
