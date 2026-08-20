# Sitemap

All public routes are locale-prefixed: `/:locale/...` where locale ∈ {ru, tg, en}, `ru` also served at `/` (root redirects to default locale is avoided — root `/` IS ru content per DEC, no redirect needed for default).

Actually: root `/` serves `ru` directly (no prefix) to keep default locale canonical & simple; `tg`/`en` are prefixed. See DEC-007 in DECISIONS.md addendum below routes.

## Public
- `/` (ru home) , `/en`, `/tg` — Homepage
- `/destinations`, `/en/destinations`, `/tg/destinations` — Destinations list
- `/destinations/:slug` — Destination detail
- `/services` — Services list
- `/offers` — Offers list
- `/offers/:slug` — Offer detail
- `/travel-request` — Travel Request form
- `/about` — About
- `/faq` — FAQ
- `/testimonials` — Testimonials
- `/contacts` — Contacts
- `/privacy-policy` — Privacy Policy
- `*` — 404

## Admin (not localized, `/admin/*`)
- `/admin/login`
- `/admin` (dashboard)
- `/admin/destinations`, `/admin/destinations/:id`
- `/admin/services`, `/admin/services/:id`
- `/admin/offers`, `/admin/offers/:id`
- `/admin/testimonials`, `/admin/testimonials/:id`
- `/admin/faq`, `/admin/faq/:id`
- `/admin/site-content`
- `/admin/travel-requests`, `/admin/travel-requests/:id`
- `/admin/countries-cities`
- `/admin/audit-log`
