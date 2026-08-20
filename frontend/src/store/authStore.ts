import type { AdminUser } from '@/types/domain'

/**
 * Minimal external store for the admin auth session (access token + current admin).
 * Deliberately not React state: the axios interceptor (outside React) needs
 * synchronous read/write access to the current token. React components subscribe
 * via useSyncExternalStore in `useAuth` (src/hooks/useAuth.ts).
 *
 * The refresh token itself is never held here — it lives only in the httpOnly
 * `refreshToken` cookie set by the backend.
 */

interface AuthState {
  accessToken: string | null
  expiresAtUtc: string | null
  admin: AdminUser | null
}

const STORAGE_KEY = 'aerotravel.admin.session'

function loadInitialState(): AuthState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { accessToken: null, expiresAtUtc: null, admin: null }
    return JSON.parse(raw) as AuthState
  } catch {
    return { accessToken: null, expiresAtUtc: null, admin: null }
  }
}

let state: AuthState = loadInitialState()
const listeners = new Set<() => void>()

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // sessionStorage unavailable (e.g. private mode edge cases) — in-memory only.
  }
}

function emit() {
  for (const listener of listeners) listener()
}

export const authStore = {
  getState(): AuthState {
    return state
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  setSession(accessToken: string, expiresAtUtc: string, admin: AdminUser) {
    state = { accessToken, expiresAtUtc, admin }
    persist()
    emit()
  },
  setAccessToken(accessToken: string, expiresAtUtc: string) {
    state = { ...state, accessToken, expiresAtUtc }
    persist()
    emit()
  },
  clear() {
    state = { accessToken: null, expiresAtUtc: null, admin: null }
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    emit()
  },
}
