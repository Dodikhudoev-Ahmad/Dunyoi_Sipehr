import { apiDelete, apiGet, apiPost, apiPut } from '@/api/client'
import { toQueryString } from '@/api/queryString'
import type { PagedResult, ListQuery } from '@/types/api'
import type { AdminServiceItem, Service, Locale } from '@/types/domain'

export interface UpsertServicePayload {
  icon: string
  isPublished: boolean
  sortOrder: number
  translations: AdminServiceItem['translations']
}

export const servicesApi = {
  publicList: (locale: Locale) => apiGet<Service[]>(`/public/services${toQueryString({ locale })}`),

  adminList: (query: ListQuery) => apiGet<PagedResult<AdminServiceItem>>(`/admin/services${toQueryString({ ...query })}`),
  adminGet: (id: string) => apiGet<AdminServiceItem>(`/admin/services/${id}`),
  adminCreate: (payload: UpsertServicePayload) => apiPost<{ id: string }>('/admin/services', payload),
  adminUpdate: (id: string, payload: UpsertServicePayload) => apiPut<void>(`/admin/services/${id}`, payload),
  adminDelete: (id: string) => apiDelete<void>(`/admin/services/${id}`),
}
