import { lazy, Suspense } from 'react'
import { Route } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { HomePage } from '@/pages/public/HomePage'
import type { Locale } from '@/types/domain'

// HomePage stays eager — it's the landing page for most visits, so there's no code-splitting
// win worth a loading flash on the single most common first paint. Every other public page is
// lazy: none of them are needed for the initial bundle, and TravelRequestPage in particular
// pulls in react-hook-form/zod (the ~97KB `vendor-forms` chunk) that no other public page uses —
// before this, every visitor's first load eagerly fetched it via modulepreload regardless of
// which page they landed on. See docs/PROGRESS.md perf stage for the before/after numbers.
const DestinationsListPage = lazy(() => import('@/pages/public/DestinationsListPage').then((m) => ({ default: m.DestinationsListPage })))
const DestinationDetailPage = lazy(() => import('@/pages/public/DestinationDetailPage').then((m) => ({ default: m.DestinationDetailPage })))
const OffersListPage = lazy(() => import('@/pages/public/OffersListPage').then((m) => ({ default: m.OffersListPage })))
const OfferDetailPage = lazy(() => import('@/pages/public/OfferDetailPage').then((m) => ({ default: m.OfferDetailPage })))
const ServicesPage = lazy(() => import('@/pages/public/ServicesPage').then((m) => ({ default: m.ServicesPage })))
const TravelRequestPage = lazy(() => import('@/pages/public/TravelRequestPage').then((m) => ({ default: m.TravelRequestPage })))
const AboutPage = lazy(() => import('@/pages/public/AboutPage').then((m) => ({ default: m.AboutPage })))
const FaqPage = lazy(() => import('@/pages/public/FaqPage').then((m) => ({ default: m.FaqPage })))
const TestimonialsPage = lazy(() => import('@/pages/public/TestimonialsPage').then((m) => ({ default: m.TestimonialsPage })))
const ContactsPage = lazy(() => import('@/pages/public/ContactsPage').then((m) => ({ default: m.ContactsPage })))
const PrivacyPolicyPage = lazy(() => import('@/pages/public/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })))
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

/**
 * Builds the shared set of public page routes under a locale layout.
 * `ru` is mounted at `path="/"`, `tg`/`en` at `path="/tg"` / `path="/en"` (see SITEMAP.md — ru unprefixed).
 */
export function publicRoutesFor(locale: Locale, path: string) {
  return (
    <Route key={locale} path={path} element={<PublicLayout locale={locale} />}>
      <Route index element={<HomePage />} />
      <Route path="destinations" element={<Suspense><DestinationsListPage /></Suspense>} />
      <Route path="destinations/:slug" element={<Suspense><DestinationDetailPage /></Suspense>} />
      <Route path="offers" element={<Suspense><OffersListPage /></Suspense>} />
      <Route path="offers/:slug" element={<Suspense><OfferDetailPage /></Suspense>} />
      <Route path="services" element={<Suspense><ServicesPage /></Suspense>} />
      <Route path="travel-request" element={<Suspense><TravelRequestPage /></Suspense>} />
      <Route path="about" element={<Suspense><AboutPage /></Suspense>} />
      <Route path="faq" element={<Suspense><FaqPage /></Suspense>} />
      <Route path="testimonials" element={<Suspense><TestimonialsPage /></Suspense>} />
      <Route path="contacts" element={<Suspense><ContactsPage /></Suspense>} />
      <Route path="privacy-policy" element={<Suspense><PrivacyPolicyPage /></Suspense>} />
      <Route path="*" element={<Suspense><NotFoundPage /></Suspense>} />
    </Route>
  )
}
