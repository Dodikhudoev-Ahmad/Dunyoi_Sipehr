import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { authStore } from '@/store/authStore'
import { ApiError, type ApiErrorCode, type ProblemDetails } from '@/types/api'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5091/api/v1'

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // required so the httpOnly refreshToken cookie round-trips on /auth/refresh
})

httpClient.interceptors.request.use((config) => {
  const { accessToken } = authStore.getState()
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

/** Marks a request as already retried once, to prevent infinite refresh loops. */
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ accessToken: string; expiresAtUtc: string }>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then((res) => {
        authStore.setAccessToken(res.data.accessToken, res.data.expiresAtUtc)
        return res.data.accessToken
      })
      .catch(() => {
        authStore.clear()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

function mapErrorCode(status: number, problem: ProblemDetails | undefined): ApiErrorCode {
  const known: ApiErrorCode[] = [
    'VALIDATION_FAILED',
    'NOT_FOUND',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'CONFLICT_DUPLICATE',
    'CONFLICT_HAS_CHILDREN',
    'RATE_LIMITED',
    'BOOTSTRAP_ALREADY_DONE',
    'INVALID_CREDENTIALS',
    'INVALID_REFRESH_TOKEN',
    'INVALID_TRANSITION',
  ]
  if (problem?.errorCode && (known as string[]).includes(problem.errorCode)) {
    return problem.errorCode as ApiErrorCode
  }
  switch (status) {
    case 400:
      return 'VALIDATION_FAILED'
    case 401:
      return 'UNAUTHORIZED'
    case 403:
      return 'FORBIDDEN'
    case 404:
      return 'NOT_FOUND'
    case 409:
      return 'CONFLICT_DUPLICATE'
    case 429:
      return 'RATE_LIMITED'
    default:
      return 'UNKNOWN_ERROR'
  }
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ProblemDetails>) => {
    const originalConfig = error.config as RetryableConfig | undefined
    const status = error.response?.status ?? 0

    const isAuthEndpoint = originalConfig?.url?.includes('/auth/')

    if (status === 401 && originalConfig && !originalConfig._retried && !isAuthEndpoint) {
      originalConfig._retried = true
      const newToken = await refreshAccessToken()
      if (newToken) {
        originalConfig.headers = originalConfig.headers ?? {}
        originalConfig.headers.set?.('Authorization', `Bearer ${newToken}`)
        return httpClient(originalConfig)
      }
      // Refresh failed: send the admin back to login.
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        window.location.assign('/admin/login')
      }
    }

    if (!error.response) {
      throw new ApiError({
        message: 'Network error — the server could not be reached.',
        status: 0,
        errorCode: 'NETWORK_ERROR',
      })
    }

    const problem = error.response.data
    throw new ApiError({
      message: problem?.detail ?? problem?.title ?? 'Unexpected error occurred.',
      status,
      errorCode: mapErrorCode(status, problem),
      fieldErrors: problem?.errors,
    })
  },
)

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await httpClient.get<T>(url, config)
  return res.data
}

export async function apiPost<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
  const res = await httpClient.post<T>(url, body, config)
  return res.data
}

export async function apiPut<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
  const res = await httpClient.put<T>(url, body, config)
  return res.data
}

export async function apiPatch<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
  const res = await httpClient.patch<T>(url, body, config)
  return res.data
}

export async function apiDelete<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await httpClient.delete<T>(url, config)
  return res.data
}

/** Fetches an authenticated binary resource (e.g. an admin-only passport photo) as a Blob —
 * for anything that can't be a plain `<img src>` because it needs the Bearer token attached. */
export async function apiGetBlob(url: string, config?: AxiosRequestConfig): Promise<Blob> {
  const res = await httpClient.get(url, { ...config, responseType: 'blob' })
  return res.data
}
