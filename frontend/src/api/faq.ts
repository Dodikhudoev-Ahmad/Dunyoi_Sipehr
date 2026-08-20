import { apiDelete, apiGet, apiPost, apiPut } from '@/api/client'
import { toQueryString } from '@/api/queryString'
import type { PagedResult, ListQuery } from '@/types/api'
import type { AdminFaqItem, FaqItem, Locale } from '@/types/domain'

export interface UpsertFaqItemPayload {
  category: string
  isPublished: boolean
  sortOrder: number
  translations: AdminFaqItem['translations']
}

export const faqApi = {
  publicList: (locale: Locale) => apiGet<FaqItem[]>(`/public/faq${toQueryString({ locale })}`),

  adminList: (query: ListQuery) => apiGet<PagedResult<AdminFaqItem>>(`/admin/faq${toQueryString({ ...query })}`),
  adminGet: (id: string) => apiGet<AdminFaqItem>(`/admin/faq/${id}`),
  adminCreate: (payload: UpsertFaqItemPayload) => apiPost<{ id: string }>('/admin/faq', payload),
  adminUpdate: (id: string, payload: UpsertFaqItemPayload) => apiPut<void>(`/admin/faq/${id}`, payload),
  adminDelete: (id: string) => apiDelete<void>(`/admin/faq/${id}`),
}
