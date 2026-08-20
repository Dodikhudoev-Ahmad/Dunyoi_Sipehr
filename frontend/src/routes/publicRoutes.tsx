import { Route } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { HomePage } from '@/pages/public/HomePage'
import { DestinationsListPage } from '@/pages/public/DestinationsListPage'
import { DestinationDetailPage } from '@/pages/public/DestinationDetailPage'
import { OffersListPage } from '@/pages/public/OffersListPage'
import { OfferDetailPage } from '@/pages/public/OfferDetailPage'
import { ServicesPage } from '@/pages/public/ServicesPage'
import { AboutPage } from '@/pages/public/AboutPage'
import { TestimonialsPage } from '@/pages/public/TestimonialsPage'
import { FaqPage } from '@/pages/public/FaqPage'
import { ContactsPage } from '@/pages/public/ContactsPage'
import { PrivacyPolicyPage } from '@/pages/public/PrivacyPolicyPage'
import { TravelRequestPage } from '@/pages/public/TravelRequestPage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import type { Locale } from '@/types/domain'

/**
 * Builds the shared set of public page routes under a locale layout.
 * `ru` is mounted at `path="/"`, `tg`/`en` at `path="/tg"` / `path="/en"` (see SITEMAP.md — ru unprefixed).
 */
export function publicRoutesFor(locale: Locale, path: string) {
  return (
    <Route key={locale} path={path} element={<PublicLayout locale={locale} />}>
      <Route index element={<HomePage />} />
      <Route path="destinations" element={<DestinationsListPage />} />
      <Route path="destinations/:slug" element={<DestinationDetailPage />} />
      <Route path="offers" element={<OffersListPage />} />
      <Route path="offers/:slug" element={<OfferDetailPage />} />
      <Route path="services" element={<ServicesPage />} />
      <Route path="travel-request" element={<TravelRequestPage />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="faq" element={<FaqPage />} />
      <Route path="testimonials" element={<TestimonialsPage />} />
      <Route path="contacts" element={<ContactsPage />} />
      <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  )
}
