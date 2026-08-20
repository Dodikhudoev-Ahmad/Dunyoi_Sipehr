import { useSyncExternalStore } from 'react'
import { authStore } from '@/store/authStore'

/** Reactive view over the auth store for components (login state, current admin). */
export function useAuth() {
  const state = useSyncExternalStore(authStore.subscribe, authStore.getState, authStore.getState)
  return {
    isAuthenticated: Boolean(state.accessToken),
    admin: state.admin,
    accessToken: state.accessToken,
  }
}
