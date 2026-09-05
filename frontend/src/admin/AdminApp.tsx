import { Routes, Route, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { AdminErrorBoundary } from '@/admin/components/ErrorBoundary'
import { AdminLayout } from '@/admin/components/AdminLayout'
import { ProtectedRoute } from '@/admin/components/ProtectedRoute'
import { SuperAdminRoute } from '@/admin/components/SuperAdminRoute'
import { NonAccountantRoute } from '@/admin/components/NonAccountantRoute'
import { FinanceRoute } from '@/admin/components/FinanceRoute'
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
import { CrmBoardPage } from '@/admin/pages/crm/CrmBoardPage'
import { TravelRequestsListPage } from '@/admin/pages/travel-requests/TravelRequestsListPage'
import { TravelRequestDetailPage } from '@/admin/pages/travel-requests/TravelRequestDetailPage'
import { FlightsListPage } from '@/admin/pages/flights/FlightsListPage'
import { FlightDetailPage } from '@/admin/pages/flights/FlightDetailPage'
import { PassengersRegistryPage } from '@/admin/pages/passengers/PassengersRegistryPage'
import { FinancePage } from '@/admin/pages/finance/FinancePage'
import { AuditLogPage } from '@/admin/pages/audit-log/AuditLogPage'
import { StaffListPage } from '@/admin/pages/staff/StaffListPage'
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
      {/* Admin isn't crawlable (robots.txt disallows /admin/) and none of these pages render
          their own <Seo> — this just keeps the browser tab title sane. AdminNotFound below is
          the one exception (it nests the public NotFoundPage, which has its own Seo); that page
          briefly ends up with two <title> tags as a result, which is harmless (document.title
          still resolves correctly — see src/lib/seo.ts) and not worth the complexity of avoiding
          on a route that's disallowed from indexing either way. */}
      <Helmet>
        <title>Dunyoi Sipehr — Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        {/* Unlinked — first-run only, see docs/DECISIONS.md */}
        <Route path="bootstrap" element={<BootstrapPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            {/* Everything below except Finance — Accountant is scoped to Finance only (see
                MASTER_TZ Finance module spec), so a direct URL into any of these redirects them
                to /admin/finance instead of reaching a page whose own API calls would 403. */}
            <Route element={<NonAccountantRoute />}>
              <Route index element={<DashboardPage />} />
              <Route path="crm" element={<CrmBoardPage />} />
              <Route path="travel-requests" element={<TravelRequestsListPage />} />
              <Route path="travel-requests/:id" element={<TravelRequestDetailPage />} />

              {/* Flights module — Editor and SuperAdmin both get full access (see
                  AdminFlightsController's RBAC exception comment), so these stay outside the
                  SuperAdminRoute guard below unlike the rest of content management. */}
              <Route path="flights" element={<FlightsListPage />} />
              <Route path="flights/:id" element={<FlightDetailPage />} />
              <Route path="passengers" element={<PassengersRegistryPage />} />

              {/* Content management + staff + audit log — SuperAdmin only. The sidebar already
                  hides these links for Editor, but this route guard is the real, independent check
                  (not a CSS trick) for anyone who navigates straight to the URL. */}
              <Route element={<SuperAdminRoute />}>
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
                <Route path="audit-log" element={<AuditLogPage />} />
                <Route path="staff" element={<StaffListPage />} />
              </Route>
            </Route>

            {/* Finance — the one section Accountant can reach; SuperAdmin can too, Editor can't. */}
            <Route element={<FinanceRoute />}>
              <Route path="finance" element={<FinancePage />} />
            </Route>

            <Route path="*" element={<AdminNotFound />} />
          </Route>
        </Route>
      </Routes>
    </AdminErrorBoundary>
  )
}
