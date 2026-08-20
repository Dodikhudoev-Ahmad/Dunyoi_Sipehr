/** Shared API envelope / query shapes used across every resource module. */

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface ListQuery {
  page?: number
  pageSize?: number
  sort?: string
  dir?: 'asc' | 'desc'
}

/** RFC7807 ProblemDetails, extended with the project's stable `errorCode`. */
export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errorCode?: string
  errors?: Record<string, string[]>
}

/** Mirrors every stable `errorCode` string the backend actually returns (grepped from
 * `Error.NotFound/Validation/Conflict/Unauthorized/Forbidden/RateLimited(...)` call sites across
 * `backend/Application` and `backend/Api`) plus two purely client-side fallbacks. */
export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT_DUPLICATE'
  | 'CONFLICT_HAS_CHILDREN'
  | 'RATE_LIMITED'
  | 'BOOTSTRAP_ALREADY_DONE'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_REFRESH_TOKEN'
  | 'INVALID_TRANSITION'
  | 'UNKNOWN_ERROR'
  | 'NETWORK_ERROR'

/** Normalized, typed error shape components can render without knowing about axios/RFC7807. */
export class ApiError extends Error {
  readonly status: number
  readonly errorCode: ApiErrorCode
  readonly fieldErrors?: Record<string, string[]>

  constructor(params: {
    message: string
    status: number
    errorCode: ApiErrorCode
    fieldErrors?: Record<string, string[]>
  }) {
    super(params.message)
    this.name = 'ApiError'
    this.status = params.status
    this.errorCode = params.errorCode
    this.fieldErrors = params.fieldErrors
  }
}
