import { apiGet, apiGetBlob, apiPatch, apiPost, API_BASE_URL } from '@/api/client'
import { toQueryString } from '@/api/queryString'
import type { PagedResult, ListQuery } from '@/types/api'
import type { AssignableAdmin, Currency, TravelRequest, TravelRequestNote, TravelRequestStatus, Locale } from '@/types/domain'

export interface TravelRequestSubmission {
  lastName: string
  firstName: string
  middleName?: string
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

  adminList: (query: ListQuery & { status?: TravelRequestStatus; from?: string; to?: string; dueBy?: string; search?: string }) =>
    apiGet<PagedResult<TravelRequest>>(`/admin/travel-requests${toQueryString({ ...query })}`),
  adminGet: (id: string) => apiGet<TravelRequest>(`/admin/travel-requests/${id}`),
  adminSetStatus: (id: string, status: TravelRequestStatus) =>
    apiPatch<TravelRequest>(`/admin/travel-requests/${id}/status`, { status }),
  adminAssign: (id: string, adminUserId: string | null) =>
    apiPatch<TravelRequest>(`/admin/travel-requests/${id}/assign`, { adminUserId }),
  /** Passport photos are never public — always fetched as an authenticated blob, never a plain `<img src>`. */
  adminGetPassportPhotoBlob: (requestId: string, fileName: string) =>
    apiGetBlob(`/admin/travel-requests/${requestId}/passport-photos/${fileName}`),

  /** Active-staff list for "assign to" dropdowns — both roles can read this. */
  adminGetAssignableAdmins: () => apiGet<AssignableAdmin[]>('/admin/travel-requests/assignable-admins'),

  adminListNotes: (requestId: string) => apiGet<TravelRequestNote[]>(`/admin/travel-requests/${requestId}/notes`),
  adminAddNote: (requestId: string, text: string) =>
    apiPost<TravelRequestNote>(`/admin/travel-requests/${requestId}/notes`, { text }),

  adminUpdateDealValue: (id: string, value: number, currency: Currency) =>
    apiPatch<void>(`/admin/travel-requests/${id}/deal-value`, { value, currency }),
  adminUpdateFollowUp: (id: string, date: string | null) =>
    apiPatch<void>(`/admin/travel-requests/${id}/follow-up`, { date }),

  /** Same filter shape as adminList (minus paging) — SuperAdmin gets every matching row, Editor
   * gets only their own assigned rows (enforced server-side, not a client-side choice). */
  adminExportXlsx: (query: { status?: TravelRequestStatus; fromUtc?: string; toUtc?: string; search?: string }) =>
    apiGetBlob(`/admin/travel-requests/export${toQueryString({ ...query })}`),
}

/** Only used to build a stable react-query cache key for a passport photo — never rendered as a
 * literal `src` (that URL requires an Authorization header the browser won't attach for us). */
export function passportPhotoCacheKey(requestId: string, fileName: string): string {
  return `${API_BASE_URL}/admin/travel-requests/${requestId}/passport-photos/${fileName}`
}
