import { apiDelete, apiGet, apiPost, apiPut } from '@/api/client'
import { toQueryString } from '@/api/queryString'
import type { PagedResult, ListQuery } from '@/types/api'
import type { AdminOfferDetail, AdminOfferListItem, Offer, Locale } from '@/types/domain'

export const offersApi = {
  publicList: (
    locale: Locale,
    params: { destinationId?: string; featured?: boolean; page?: number; pageSize?: number } = {},
  ) => apiGet<PagedResult<Offer>>(`/public/offers${toQueryString({ locale, ...params })}`),

  publicGetBySlug: (slug: string, locale: Locale) =>
    apiGet<Offer>(`/public/offers/${slug}${toQueryString({ locale })}`),

  adminList: (query: ListQuery & { destinationId?: string; isPublished?: boolean }) =>
    apiGet<PagedResult<AdminOfferListItem>>(`/admin/offers${toQueryString({ ...query })}`),
  adminGet: (id: string) => apiGet<AdminOfferDetail>(`/admin/offers/${id}`),
  adminCreate: (payload: AdminOfferDetail) => apiPost<{ id: string }>('/admin/offers', payload),
  adminUpdate: (id: string, payload: AdminOfferDetail) => apiPut<void>(`/admin/offers/${id}`, payload),
  adminDelete: (id: string) => apiDelete<void>(`/admin/offers/${id}`),
}
