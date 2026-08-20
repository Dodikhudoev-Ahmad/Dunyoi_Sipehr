import { apiGet, apiGetBlob, apiPatch, apiPost, API_BASE_URL } from '@/api/client'
import { toQueryString } from '@/api/queryString'
import type { PagedResult, ListQuery } from '@/types/api'
import type { TravelRequest, TravelRequestStatus, Locale } from '@/types/domain'

export interface TravelRequestSubmission {
  fullName: string
  email: string
  /** Full number in +992XXXXXXXXX format — already composed with the fixed prefix by the caller. */
  phone: string
  preferredLocale: Locale
  destinationId?: string | null
  offerId?: string | null
  departureDate: string
  returnDate?: string | null
  passengersAdults: number
  passengersChildren: number
  childrenAges: number[]
  message?: string
  passportPhotoPaths: string[]
  passportDataConsentAccepted: boolean
  consentAccepted: boolean
  /** Honeypot — must stay empty; bots that fill hidden fields get silently rejected server-side. */
  website?: string
  sourceUtm?: { utmSource?: string; utmMedium?: string; utmCampaign?: string }
}

export const travelRequestsApi = {
  publicSubmit: (payload: TravelRequestSubmission) =>
    apiPost<TravelRequest>('/public/travel-requests', payload),

  /** Uploads one passport/ID photo ahead of submission; returns the server-generated filename to
   * include in the subsequent `publicSubmit` call's `passportPhotoPaths`. */
  publicUploadPassportPhoto: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiPost<string>('/public/travel-requests/passport-photos', formData)
  },

  adminList: (query: ListQuery & { status?: TravelRequestStatus; from?: string; to?: string }) =>
    apiGet<PagedResult<TravelRequest>>(`/admin/travel-requests${toQueryString({ ...query })}`),
  adminGet: (id: string) => apiGet<TravelRequest>(`/admin/travel-requests/${id}`),
  adminSetStatus: (id: string, status: TravelRequestStatus) =>
    apiPatch<TravelRequest>(`/admin/travel-requests/${id}/status`, { status }),
  adminAssign: (id: string, adminUserId: string | null) =>
    apiPatch<TravelRequest>(`/admin/travel-requests/${id}/assign`, { adminUserId }),
  /** Passport photos are never public — always fetched as an authenticated blob, never a plain `<img src>`. */
  adminGetPassportPhotoBlob: (requestId: string, fileName: string) =>
    apiGetBlob(`/admin/travel-requests/${requestId}/passport-photos/${fileName}`),
}

/** Only used to build a stable react-query cache key for a passport photo — never rendered as a
 * literal `src` (that URL requires an Authorization header the browser won't attach for us). */
export function passportPhotoCacheKey(requestId: string, fileName: string): string {
  return `${API_BASE_URL}/admin/travel-requests/${requestId}/passport-photos/${fileName}`
}
