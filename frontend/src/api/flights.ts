import { apiDelete, apiGet, apiGetBlob, apiPost, apiPut } from '@/api/client'
import { toQueryString } from '@/api/queryString'
import type { PagedResult, ListQuery } from '@/types/api'
import type { Flight, FlightDetail, FlightPassenger, FlightStatus, PassengerRegistryItem } from '@/types/domain'

export interface UpsertFlightPayload {
  flightNumber: string
  originCityId: string
  destinationCityId: string
  departureAtUtc: string
  status: FlightStatus
}

export const flightsApi = {
  adminList: (query: ListQuery & { status?: FlightStatus; fromUtc?: string; toUtc?: string; search?: string }) =>
    apiGet<PagedResult<Flight>>(`/admin/flights${toQueryString({ ...query })}`),
  adminGet: (id: string) => apiGet<FlightDetail>(`/admin/flights/${id}`),
  /** Suggested next flight number for the "Добавить рейс" form, computed server-side across every
   * flight (not just whatever page is cached client-side). Null when no existing number has a
   * parseable trailing digit run to increment from. */
  adminGetNextNumber: () => apiGet<{ suggestedNumber: string | null }>('/admin/flights/next-number'),
  adminCreate: (payload: UpsertFlightPayload) => apiPost<{ id: string }>('/admin/flights', payload),
  adminUpdate: (id: string, payload: UpsertFlightPayload) => apiPut<void>(`/admin/flights/${id}`, payload),
  adminDelete: (id: string) => apiDelete<void>(`/admin/flights/${id}`),
  adminExportXlsx: (id: string) => apiGetBlob(`/admin/flights/${id}/export`),

  adminListPassengers: (flightId: string) => apiGet<FlightPassenger[]>(`/admin/flights/${flightId}/passengers`),
  adminAddManualPassenger: (flightId: string, payload: { fullName: string; phone: string }) =>
    apiPost<{ id: string }>(`/admin/flights/${flightId}/passengers/manual`, payload),
  adminAddPassengerFromRequest: (flightId: string, payload: { travelRequestId: string; fullName: string; phone: string }) =>
    apiPost<{ id: string }>(`/admin/flights/${flightId}/passengers/from-request`, payload),
  adminDeletePassenger: (flightId: string, passengerId: string) =>
    apiDelete<void>(`/admin/flights/${flightId}/passengers/${passengerId}`),
  /** SuperAdmin-only server-side (backend enforces this too, 403 for Editor) — moves a passenger
   * to a different flight's manifest. */
  adminTransferPassenger: (payload: { passengerId: string; targetFlightId: string }) =>
    apiPost<void>('/admin/flights/transfer-passenger', payload),
}

export const passengersApi = {
  adminList: (query: ListQuery & { flightId?: string; search?: string; departureFromUtc?: string; departureToUtc?: string }) =>
    apiGet<PagedResult<PassengerRegistryItem>>(`/admin/passengers${toQueryString({ ...query })}`),
  adminExportXlsx: (query: { flightId?: string; search?: string; departureFromUtc?: string; departureToUtc?: string }) =>
    apiGetBlob(`/admin/passengers/export${toQueryString({ ...query })}`),
}
