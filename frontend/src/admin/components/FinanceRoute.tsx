import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

/** Guards /admin/finance itself: only Accountant and SuperAdmin get in, mirroring the backend's
 * `[Authorize(Roles = "Accountant,SuperAdmin")]` on AdminFinanceController. An Editor navigating
 * here (bookmark, typed URL) is bounced back to the dashboard. */
export function FinanceRoute() {
  const { admin } = useAuth()

  if (admin?.role !== 'Accountant' && admin?.role !== 'SuperAdmin') {
    return <Navigate to="/admin" replace />
  }
  return <Outlet />
}
