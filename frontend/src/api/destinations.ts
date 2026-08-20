import { apiDelete, apiGet, apiPost, apiPut } from '@/api/client'
import { toQueryString } from '@/api/queryString'
import type { PagedResult, ListQuery } from '@/types/api'
import type { AdminDestinationDetail, AdminDestinationListItem, Destination, Locale } from '@/types/domain'

export const destinationsApi = {
  publicList: (
    locale: Locale,
    params: { featured?: boolean; cityId?: string; page?: number; pageSize?: number } = {},
  ) => apiGet<PagedResult<Destination>>(`/public/destinations${toQueryString({ locale, ...params })}`),

  publicGetBySlug: (slug: string, locale: Locale) =>
    apiGet<Destination>(`/public/destinations/${slug}${toQueryString({ locale })}`),

  adminList: (query: ListQuery & { cityId?: string; isPublished?: boolean }) =>
    apiGet<PagedResult<AdminDestinationListItem>>(`/admin/destinations${toQueryString({ ...query })}`),
  adminGet: (id: string) => apiGet<AdminDestinationDetail>(`/admin/destinations/${id}`),
  adminCreate: (payload: AdminDestinationDetail) => apiPost<{ id: string }>('/admin/destinations', payload),
  adminUpdate: (id: string, payload: AdminDestinationDetail) => apiPut<void>(`/admin/destinations/${id}`, payload),
  adminDelete: (id: string) => apiDelete<void>(`/admin/destinations/${id}`),
}
