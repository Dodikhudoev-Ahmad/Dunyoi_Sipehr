import { apiDelete, apiGet, apiPost, apiPut } from '@/api/client'
import { toQueryString } from '@/api/queryString'
import type { PagedResult, ListQuery } from '@/types/api'
import type { AdminCityItem, City, Locale } from '@/types/domain'

export interface UpsertCityPayload {
  countryId: string
  sortOrder: number
  translations: AdminCityItem['translations']
}

export const citiesApi = {
  publicList: (locale: Locale, countryId?: string) =>
    apiGet<City[]>(`/public/cities${toQueryString({ locale, countryId })}`),

  adminList: (query: ListQuery & { countryId?: string }) =>
    apiGet<PagedResult<AdminCityItem>>(`/admin/cities${toQueryString({ ...query })}`),
  adminGet: (id: string) => apiGet<AdminCityItem>(`/admin/cities/${id}`),
  adminCreate: (payload: UpsertCityPayload) => apiPost<{ id: string }>('/admin/cities', payload),
  adminUpdate: (id: string, payload: UpsertCityPayload) => apiPut<void>(`/admin/cities/${id}`, payload),
  adminDelete: (id: string) => apiDelete<void>(`/admin/cities/${id}`),
}
