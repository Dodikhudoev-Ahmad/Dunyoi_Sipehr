import { apiDelete, apiGet, apiPost, apiPut } from '@/api/client'
import { toQueryString } from '@/api/queryString'
import type { PagedResult, ListQuery } from '@/types/api'
import type { AdminCountryItem, Country, Locale } from '@/types/domain'

export interface UpsertCountryPayload {
  isoCode: string
  sortOrder: number
  translations: AdminCountryItem['translations']
}

export const countriesApi = {
  publicList: (locale: Locale) => apiGet<Country[]>(`/public/countries${toQueryString({ locale })}`),

  adminList: (query: ListQuery) =>
    apiGet<PagedResult<AdminCountryItem>>(`/admin/countries${toQueryString({ ...query })}`),
  adminGet: (id: string) => apiGet<AdminCountryItem>(`/admin/countries/${id}`),
  adminCreate: (payload: UpsertCountryPayload) => apiPost<{ id: string }>('/admin/countries', payload),
  adminUpdate: (id: string, payload: UpsertCountryPayload) => apiPut<void>(`/admin/countries/${id}`, payload),
  adminDelete: (id: string) => apiDelete<void>(`/admin/countries/${id}`),
}
