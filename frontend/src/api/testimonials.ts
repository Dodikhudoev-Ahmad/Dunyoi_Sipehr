import { apiDelete, apiGet, apiPost, apiPut } from '@/api/client'
import { toQueryString } from '@/api/queryString'
import type { PagedResult, ListQuery } from '@/types/api'
import type { AdminTestimonialItem, Testimonial, Locale } from '@/types/domain'

export interface UpsertTestimonialPayload {
  authorName: string
  authorCountry: string
  avatarUrl: string | null
  rating: number
  isPublished: boolean
  sortOrder: number
  translations: AdminTestimonialItem['translations']
}

export const testimonialsApi = {
  publicList: (locale: Locale) => apiGet<Testimonial[]>(`/public/testimonials${toQueryString({ locale })}`),

  adminList: (query: ListQuery) =>
    apiGet<PagedResult<AdminTestimonialItem>>(`/admin/testimonials${toQueryString({ ...query })}`),
  adminGet: (id: string) => apiGet<AdminTestimonialItem>(`/admin/testimonials/${id}`),
  adminCreate: (payload: UpsertTestimonialPayload) => apiPost<{ id: string }>('/admin/testimonials', payload),
  adminUpdate: (id: string, payload: UpsertTestimonialPayload) => apiPut<void>(`/admin/testimonials/${id}`, payload),
  adminDelete: (id: string) => apiDelete<void>(`/admin/testimonials/${id}`),
}
