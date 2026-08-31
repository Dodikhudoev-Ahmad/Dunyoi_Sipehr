import { apiDelete, apiGet, apiGetBlob, apiPost, apiPut } from '@/api/client'
import { toQueryString } from '@/api/queryString'
import type { PagedResult, ListQuery } from '@/types/api'
import type { Flight, FlightDetail, FlightPassenger, FlightStatus, PassengerRegistryItem } from '@/types/domain'

export interface UpsertFlightPayload {
  flightNumber: string
  originCity: string
  destinationCity: string
  departureAtUtc: string
  status: FlightStatus
}

export const flightsApi = {
  adminList: (query: ListQuery & { status?: FlightStatus; fromUtc?: string; toUtc?: string; search?: string }) =>
    apiGet<PagedResult<Flight>>(`/admin/flights${toQueryString({ ...query })}`),
  adminGet: (id: string) => apiGet<FlightDetail>(`/admin/flights/${id}`),
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
}

export const passengersApi = {
  adminList: (query: ListQuery & { flightId?: string; search?: string; departureFromUtc?: string; departureToUtc?: string }) =>
    apiGet<PagedResult<PassengerRegistryItem>>(`/admin/passengers${toQueryString({ ...query })}`),
  adminExportXlsx: (query: { flightId?: string; search?: string; departureFromUtc?: string; departureToUtc?: string }) =>
    apiGetBlob(`/admin/passengers/export${toQueryString({ ...query })}`),
}
