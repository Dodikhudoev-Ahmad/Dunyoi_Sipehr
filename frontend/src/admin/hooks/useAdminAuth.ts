import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { authStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'

export function useAdminLogin() {
  return useMutation({
    mutationFn: (payload: { email: string; password: string }) => authApi.login(payload.email, payload.password),
    onSuccess: (data) => authStore.setSession(data.accessToken, data.expiresAtUtc, data.admin),
  })
}

/** POST /auth/bootstrap only creates the account (no tokens) — chain a login with the same
 * credentials so the freshly-created SuperAdmin lands in an authenticated session. */
export function useAdminBootstrap() {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string; displayName: string }) => {
      await authApi.bootstrap(payload)
      return authApi.login(payload.email, payload.password)
    },
    onSuccess: (data) => authStore.setSession(data.accessToken, data.expiresAtUtc, data.admin),
  })
}

export function useAdminLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      authStore.clear()
      queryClient.clear()
      navigate('/admin/login')
    },
  })
}

export { useAuth as useAdminSession }
