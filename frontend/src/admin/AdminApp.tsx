import { Routes, Route, useLocation } from 'react-router-dom'
import { AdminErrorBoundary } from '@/admin/components/ErrorBoundary'
import { AdminLayout } from '@/admin/components/AdminLayout'
import { ProtectedRoute } from '@/admin/components/ProtectedRoute'
import { LoginPage } from '@/admin/pages/LoginPage'
import { BootstrapPage } from '@/admin/pages/BootstrapPage'
import { DashboardPage } from '@/admin/pages/DashboardPage'
import { DestinationsListPage } from '@/admin/pages/destinations/DestinationsListPage'
import { DestinationFormPage } from '@/admin/pages/destinations/DestinationFormPage'
import { OffersListPage } from '@/admin/pages/offers/OffersListPage'
import { OfferFormPage } from '@/admin/pages/offers/OfferFormPage'
import { ServicesListPage } from '@/admin/pages/services/ServicesListPage'
import { ServiceFormPage } from '@/admin/pages/services/ServiceFormPage'
import { TestimonialsListPage } from '@/admin/pages/testimonials/TestimonialsListPage'
import { TestimonialFormPage } from '@/admin/pages/testimonials/TestimonialFormPage'
import { FaqListPage } from '@/admin/pages/faq/FaqListPage'
import { FaqFormPage } from '@/admin/pages/faq/FaqFormPage'
import { SiteContentPage } from '@/admin/pages/site-content/SiteContentPage'
import { CountriesCitiesPage } from '@/admin/pages/countries-cities/CountriesCitiesPage'
import { TravelRequestsListPage } from '@/admin/pages/travel-requests/TravelRequestsListPage'
import { TravelRequestDetailPage } from '@/admin/pages/travel-requests/TravelRequestDetailPage'
import { AuditLogPage } from '@/admin/pages/audit-log/AuditLogPage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { LocaleProvider } from '@/i18n/LocaleContext'

/** Admin UI is ru-only per MASTER_TZ (no locale switching needed). */
function AdminNotFound() {
  return (
    <LocaleProvider locale="ru">
      <NotFoundPage />
    </LocaleProvider>
  )
}

/**
 * The entire admin CMS as one self-contained route tree, mounted under `/admin/*` via
 * `React.lazy` in `App.tsx`. Public visitors and admin staff are different audiences reading
 * different code — this keeps every admin page, and its heavier form/table dependencies, out of
 * the public site's initial JS bundle (see docs/PROGRESS.md code-splitting entry).
 */
export default function AdminApp() {
  const location = useLocation()
  return (
    // Keyed by pathname so navigating to a different admin route (even client-side, without a
    // full reload) remounts the boundary and clears a previous crash instead of getting stuck.
    <AdminErrorBoundary key={location.pathname}>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        {/* Unlinked — first-run only, see docs/DECISIONS.md */}
        <Route path="bootstrap" element={<BootstrapPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="destinations" element={<DestinationsListPage />} />
            <Route path="destinations/:id" element={<DestinationFormPage />} />
            <Route path="offers" element={<OffersListPage />} />
            <Route path="offers/:id" element={<OfferFormPage />} />
            <Route path="services" element={<ServicesListPage />} />
            <Route path="services/:id" element={<ServiceFormPage />} />
            <Route path="testimonials" element={<TestimonialsListPage />} />
            <Route path="testimonials/:id" element={<TestimonialFormPage />} />
            <Route path="faq" element={<FaqListPage />} />
            <Route path="faq/:id" element={<FaqFormPage />} />
            <Route path="site-content" element={<SiteContentPage />} />
            <Route path="countries-cities" element={<CountriesCitiesPage />} />
            <Route path="travel-requests" element={<TravelRequestsListPage />} />
            <Route path="travel-requests/:id" element={<TravelRequestDetailPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
            <Route path="*" element={<AdminNotFound />} />
          </Route>
        </Route>
      </Routes>
    </AdminErrorBoundary>
  )
}
