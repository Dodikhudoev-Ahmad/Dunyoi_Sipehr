import { apiGet, apiPatch, apiPost } from '@/api/client'
import { toQueryString } from '@/api/queryString'
import type { PagedResult } from '@/types/api'
import type { AdminRole, AdminStaff } from '@/types/domain'

export interface CreateStaffPayload {
  displayName: string
  email: string
  password: string
  role: AdminRole
}

export interface UpdateStaffPayload {
  displayName?: string
  role?: AdminRole
  isActive?: boolean
}

/** SuperAdmin-only surface — the backend enforces this too (403 for Editor), this module is just
 * the typed client for it. */
export const adminStaffApi = {
  list: (query: { page?: number; pageSize?: number }) => apiGet<PagedResult<AdminStaff>>(`/admin/staff${toQueryString(query)}`),
  create: (payload: CreateStaffPayload) => apiPost<{ id: string }>('/admin/staff', payload),
  update: (id: string, payload: UpdateStaffPayload) => apiPatch<void>(`/admin/staff/${id}`, payload),
  /** Returns the new temporary password exactly once — never retrievable again after this call. */
  resetPassword: (id: string) => apiPost<{ temporaryPassword: string }>(`/admin/staff/${id}/reset-password`),
}
