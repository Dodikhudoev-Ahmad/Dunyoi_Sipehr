import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

/**
 * Second, independent layer on top of the sidebar's conditional rendering and the backend's
 * `[Authorize(Roles = "SuperAdmin")]` — an Editor who navigates straight to a SuperAdmin-only
 * URL (bookmark, typed address, stale link) gets redirected here rather than reaching a page that
 * would just fail its own API calls with 403s. This is a real conditional on the actual session
 * role (from the JWT-derived `admin` object), not a CSS trick.
 */
export function SuperAdminRoute() {
  const { admin } = useAuth()

  if (admin?.role !== 'SuperAdmin') {
    return <Navigate to="/admin" replace />
  }
  return <Outlet />
}
