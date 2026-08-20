# MASTER_TZ — AeroTravel

Premium international travel / aviation agency platform: public marketing site + lead-generation (Travel Request) + admin CMS.

Authored by the build agent as the source of truth (no prior spec existed). Status: living document — amend via `docs/DECISIONS.md`, not silently.

## 1. Product Summary

AeroTravel is a boutique travel agency's digital presence:

- **Public site**: premium marketing site showcasing destinations, curated travel offers/services, and company trust signals (testimonials, FAQ). Visitors submit a **Travel Request** (structured lead form) instead of a live booking/payment flow — this is a lead-gen agency site, not an OTA with checkout.
- **Admin CMS**: authenticated staff manage all public content (destinations, offers, services, hero/site content, testimonials, FAQ) and process incoming Travel Requests through a workflow (new → contacted → qualified → won/lost).

No payments, no real-time flight inventory, no user-facing accounts (customers do not log in — only staff do).

## 2. Languages

Three locales, path-prefixed routing:

- `ru` (Russian) — **default / fallback**
- `tg` (Tajik)
- `en` (English)

Fallback rule: if a translation is missing for a locale, fall back to `ru`. Admin UI is `ru`-only (internal tool, no localization needed for v1).

## 3. Domain Model (summary — full detail in docs/DOMAIN_MODEL.md)

- **AdminUser** — staff account (email, password hash, role, refresh tokens)
- **Country** — has translated name, ISO code
- **City** — belongs to Country, translated name
- **Destination** — belongs to City, the core "place to visit" catalog entity: translated title/description, hero image, gallery, highlights, is_featured, is_published, slug
- **Service** — a travel service category agency offers (e.g. Visa Support, Hotel Booking, Flight Tickets, Tour Packages): translated name/description, icon, is_published
- **Offer** — a sellable package tied to a Destination and optionally Services: translated title/description, price_from, currency, duration_days, gallery, is_featured, is_published, valid_until
- **TravelRequest** — the lead: contact info, passenger count/details, requested destination/offer (hybrid: FK reference **and** denormalized snapshot fields so history survives catalog edits/deletion), message, consent_accepted, status (state machine), source metadata (UTM, locale), audit trail
- **Testimonial** — author name, country, translated quote, rating, avatar, is_published
- **FaqItem** — translated question/answer, category, sort_order, is_published
- **SiteContent** — key-value structured content blocks for hero/about/contacts (translated), singleton-per-key
- **AuditLog** — append-only record of admin mutations (who/what/when) for TravelRequest and CMS entities

Translation strategy: each translatable entity has a child `*Translation` table (EntityId, Locale, fields...) — chosen over JSON columns for query/index-ability and admin editing simplicity. See DEC-001.

## 4. Travel Request Workflow (state machine)

`New → Contacted → Qualified → Won` or `Lost` (terminal). Any non-terminal state can move to `Lost`. Admin-only transitions, logged to AuditLog. Anti-spam: honeypot field + rate limiting by IP (see DEC-004).

## 5. Non-Functional Requirements

- Public read endpoints cached (in-memory, short TTL) and invalidated on relevant admin writes.
- JWT access token (short-lived) + rotating refresh token (httpOnly cookie) for AdminUser auth.
- Rate limiting on public write endpoints (Travel Request submission) and login.
- Structured logging with correlation ID middleware; global exception handler mapping to RFC7807 ProblemDetails with stable `errorCode` strings.
- OpenAPI/Swagger in Development.
- Health check endpoint `/health`.
- Pagination/filtering/sorting on all admin list endpoints with an explicit sortable-fields whitelist.

## 6. Tech Stack (fixed)

**Backend**: ASP.NET Core (.NET 10), Clean Architecture (Domain/Application/Infrastructure/Api), EF Core + PostgreSQL, FluentValidation, CQRS via MediatR, Result pattern, xUnit tests.

**Frontend**: React 18 + TypeScript (strict) + Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form + Zod, Axios, Motion (framer-motion successor), lucide-react icons.

## 7. Design Direction

See `docs/DESIGN_BIBLE.md`. Signature motif: **Aero Map Background** (subtle world map, route arcs, coordinate/grid details, premium grain, restrained gradients). Premium international aviation/travel tone — not a generic template.

## 8. Acceptance Criteria (v1 "production-ready locally")

- Backend builds with zero errors/warnings; unit + integration tests pass.
- Frontend builds with zero TypeScript errors; lints clean.
- All public pages render real data from the API (no mock/demo data in production code paths).
- Admin can log in and perform full CRUD on every CMS entity, and manage Travel Requests end to end.
- RU/TG/EN routing works with fallback.
- `.env.example` and deployment configs exist for Railway (backend+db) and Netlify (frontend) even without live credentials.
