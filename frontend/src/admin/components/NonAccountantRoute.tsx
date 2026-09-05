import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

/**
 * Guards every admin route except Finance. Accountant is scoped to Finance only (see MASTER_TZ
 * Finance module spec + AdminLayout.tsx's nav filter) — a direct URL/bookmark into any other
 * section redirects here instead of reaching a page whose own API calls would just 403. This is
 * the mirror image of SuperAdminRoute: that one lets through only SuperAdmin, this one lets
 * through everyone *except* Accountant.
 */
export function NonAccountantRoute() {
  const { admin } = useAuth()

  if (admin?.role === 'Accountant') {
    return <Navigate to="/admin/finance" replace />
  }
  return <Outlet />
}
