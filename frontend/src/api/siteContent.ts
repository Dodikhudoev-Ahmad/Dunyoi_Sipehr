import { apiDelete, apiGet, apiPost, apiPut } from '@/api/client'
import { toQueryString } from '@/api/queryString'
import type { PagedResult, ListQuery } from '@/types/api'
import type { AdminSiteContentItem, SiteContent, Locale } from '@/types/domain'

export interface UpsertSiteContentPayload {
  key: string
  translations: AdminSiteContentItem['translations']
}

export const siteContentApi = {
  publicGet: (key: string, locale: Locale) =>
    apiGet<SiteContent>(`/public/site-content/${key}${toQueryString({ locale })}`),

  adminList: (query: ListQuery) =>
    apiGet<PagedResult<AdminSiteContentItem>>(`/admin/site-content${toQueryString({ ...query })}`),
  adminGet: (id: string) => apiGet<AdminSiteContentItem>(`/admin/site-content/${id}`),
  adminCreate: (payload: UpsertSiteContentPayload) => apiPost<{ id: string }>('/admin/site-content', payload),
  adminUpdate: (id: string, payload: UpsertSiteContentPayload) => apiPut<void>(`/admin/site-content/${id}`, payload),
  adminDelete: (id: string) => apiDelete<void>(`/admin/site-content/${id}`),
}
