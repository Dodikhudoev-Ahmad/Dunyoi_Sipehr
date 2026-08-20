import { apiGet, apiPost } from '@/api/client'
import type { AdminUser } from '@/types/domain'

export interface LoginResponse {
  accessToken: string
  expiresAtUtc: string
  admin: AdminUser
}

export const authApi = {
  login: (email: string, password: string) => apiPost<LoginResponse>('/auth/login', { email, password }),
  refresh: () => apiPost<{ accessToken: string; expiresAtUtc: string }>('/auth/refresh'),
  logout: () => apiPost<void>('/auth/logout'),
  me: () => apiGet<AdminUser>('/auth/me'),
  // POST /auth/bootstrap only ever succeeds once (creates the first SuperAdmin) and returns the
  // created AdminUser — no tokens. It does NOT log the caller in; callers must follow up with
  // authApi.login using the same credentials (see admin/pages/BootstrapPage.tsx).
  bootstrap: (payload: { email: string; password: string; displayName: string }) =>
    apiPost<AdminUser>('/auth/bootstrap', payload),
}
