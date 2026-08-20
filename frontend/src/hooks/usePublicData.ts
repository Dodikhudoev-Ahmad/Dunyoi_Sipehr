import { useQuery } from '@tanstack/react-query'
import { destinationsApi } from '@/api/destinations'
import { offersApi } from '@/api/offers'
import { servicesApi } from '@/api/services'
import { testimonialsApi } from '@/api/testimonials'
import { faqApi } from '@/api/faq'
import { countriesApi } from '@/api/countries'
import { citiesApi } from '@/api/cities'
import { siteContentApi } from '@/api/siteContent'
import type { Locale } from '@/types/domain'

/** Public catalog data changes rarely; cache for a few minutes to cut redundant fetches. */
const PUBLIC_STALE_TIME = 5 * 60 * 1000

export function useDestinations(
  locale: Locale,
  params: { featured?: boolean; cityId?: string; page?: number; pageSize?: number } = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['public', 'destinations', locale, params],
    queryFn: () => destinationsApi.publicList(locale, params),
    staleTime: PUBLIC_STALE_TIME,
    enabled: options.enabled ?? true,
  })
}

export function useDestination(slug: string, locale: Locale) {
  return useQuery({
    queryKey: ['public', 'destination', slug, locale],
    queryFn: () => destinationsApi.publicGetBySlug(slug, locale),
    staleTime: PUBLIC_STALE_TIME,
    enabled: Boolean(slug),
  })
}

export function useOffers(locale: Locale, params: { destinationId?: string; featured?: boolean; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['public', 'offers', locale, params],
    queryFn: () => offersApi.publicList(locale, params),
    staleTime: PUBLIC_STALE_TIME,
  })
}

export function useOffer(slug: string, locale: Locale) {
  return useQuery({
    queryKey: ['public', 'offer', slug, locale],
    queryFn: () => offersApi.publicGetBySlug(slug, locale),
    staleTime: PUBLIC_STALE_TIME,
    enabled: Boolean(slug),
  })
}

export function useServices(locale: Locale) {
  return useQuery({
    queryKey: ['public', 'services', locale],
    queryFn: () => servicesApi.publicList(locale),
    staleTime: PUBLIC_STALE_TIME,
  })
}

export function useTestimonials(locale: Locale) {
  return useQuery({
    queryKey: ['public', 'testimonials', locale],
    queryFn: () => testimonialsApi.publicList(locale),
    staleTime: PUBLIC_STALE_TIME,
  })
}

export function useFaq(locale: Locale) {
  return useQuery({
    queryKey: ['public', 'faq', locale],
    queryFn: () => faqApi.publicList(locale),
    staleTime: PUBLIC_STALE_TIME,
  })
}

export function useCountries(locale: Locale) {
  return useQuery({
    queryKey: ['public', 'countries', locale],
    queryFn: () => countriesApi.publicList(locale),
    staleTime: PUBLIC_STALE_TIME,
  })
}

export function useCities(locale: Locale, countryId?: string) {
  return useQuery({
    queryKey: ['public', 'cities', locale, countryId],
    queryFn: () => citiesApi.publicList(locale, countryId),
    staleTime: PUBLIC_STALE_TIME,
  })
}

export function useSiteContent(key: string, locale: Locale) {
  return useQuery({
    queryKey: ['public', 'site-content', key, locale],
    queryFn: () => siteContentApi.publicGet(key, locale),
    staleTime: PUBLIC_STALE_TIME,
  })
}
