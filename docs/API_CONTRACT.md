# API Contract (v1)

Base path: `/api/v1`. All responses JSON. Errors: RFC7807 ProblemDetails with `errorCode` extension field.

## Conventions
- List endpoints: `?page=1&pageSize=20&sort=field&dir=asc|desc&filter[...]=...` — sortable fields whitelisted per-endpoint (rejected sort → 400).
- Locale for public GET endpoints: `?locale=ru|tg|en` (default `ru`), or resolved from route prefix on the frontend before calling.
- Auth: `Authorization: Bearer <accessToken>`; refresh token in httpOnly `refreshToken` cookie.

## Public (anonymous, cached)
- `GET /public/countries`
- `GET /public/cities?countryId=`
- `GET /public/destinations?featured=&cityId=&page=&pageSize=`
- `GET /public/destinations/{slug}`
- `GET /public/services`
- `GET /public/offers?destinationId=&featured=&page=&pageSize=`
- `GET /public/offers/{slug}`
- `GET /public/testimonials`
- `GET /public/faq`
- `GET /public/site-content/{key}`
- `POST /public/travel-requests` (rate-limited, honeypot field `website` must be empty; now also requires `departureDate`, `childrenAges` matching `passengersChildren`, `passportPhotoPaths` (1-2 filenames from the upload endpoint below), `passportDataConsentAccepted: true` — see DEC-012)
- `POST /public/travel-requests/passport-photos` (multipart `file`, image/* sniffed server-side by magic bytes not extension, ≤8MB) → generated filename (`string`), to be included in the `passportPhotoPaths` array of the `Create` call above

## Auth
- `POST /auth/login` { email, password } → { accessToken, expiresAtUtc, admin }
- `POST /auth/refresh` (reads cookie) → { accessToken, expiresAtUtc }
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/bootstrap` (only works when zero AdminUsers exist — creates first SuperAdmin; disabled thereafter, returns 403)

## Admin (Bearer required)
Full CRUD (`GET list`, `GET {id}`, `POST`, `PUT {id}`, `DELETE {id}`) for:
`/admin/countries`, `/admin/cities`, `/admin/destinations`, `/admin/services`, `/admin/offers`, `/admin/testimonials`, `/admin/faq`, `/admin/site-content`

`DELETE` on every entry above additionally requires the `SuperAdmin` role (`Editor` gets 403 Forbidden) — see docs/DECISIONS.md DEC-009.

Travel Requests (no create/delete — created only by public endpoint):
- `GET /admin/travel-requests` (filter by status, date range)
- `GET /admin/travel-requests/{id}`
- `PATCH /admin/travel-requests/{id}/status` { status }
- `PATCH /admin/travel-requests/{id}/assign` { adminUserId }
- `GET /admin/travel-requests/{id}/passport-photos/{fileName}` (streams the image bytes; ownership-scoped — 404 if `fileName` isn't in that request's `PassportPhotoPaths` — never a public/static URL, see DEC-012)

Audit:
- `GET /admin/audit-log?entityType=&entityId=&page=`

## Error Codes (stable, complete — grepped from every `Error.NotFound/Validation/Conflict/Unauthorized/Forbidden/RateLimited(...)` call site in `backend/Application` and `backend/Api`)
`VALIDATION_FAILED`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `CONFLICT_DUPLICATE`, `CONFLICT_HAS_CHILDREN`, `RATE_LIMITED`, `BOOTSTRAP_ALREADY_DONE`, `INVALID_CREDENTIALS`, `INVALID_REFRESH_TOKEN`, `INVALID_TRANSITION`.
