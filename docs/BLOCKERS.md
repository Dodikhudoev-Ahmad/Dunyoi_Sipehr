# External Blockers

Items that require a secret, account, or domain the build agent does not have. Each has a dev-safe fallback in place so the rest of the project is unaffected.

| ID | Item | Fallback in place | Needed from user before real production launch |
|---|---|---|---|
| BLK-001 | Production PostgreSQL connection string (Railway) | Local/dev connection string via `.env` / `appsettings.Development.json`; `DATABASE_URL` env var read at startup | Railway project + `DATABASE_URL` |
| BLK-002 | JWT signing secret for production | Dev-only secret generated locally, never committed; `Jwt__Secret` env var expected | Strong secret set in Railway env vars |
| BLK-003 | Netlify site + production API URL | Frontend reads `VITE_API_BASE_URL` from env, defaults to `http://localhost:5091/api/v1` in dev (matches `backend/Api/Properties/launchSettings.json`) | Netlify site, env var pointing at deployed backend |
| BLK-004 | CAPTCHA provider (reCAPTCHA/hCaptcha) key for Travel Request anti-spam | Honeypot field + IP rate limiting (see DEC-004) | Provider account + site/secret key if stronger anti-spam desired |
| BLK-005 | Transactional email provider (e.g. for notifying staff of new Travel Requests) | Not implemented in v1 — requests visible in Admin dashboard only | Email API key (SendGrid/Postmark/etc.) if email notifications are required |
| BLK-006 | Custom production domain | Railway/Netlify default subdomains used in deployment docs | Domain registrar + DNS access |
| BLK-007 | Real destination/offer photography | Placeholder image URLs (picsum/local static) used in dev seed data only, never in production code paths | Licensed photography or stock subscription |
| BLK-008 | Protected object storage for uploaded passport photos (sensitive PII, see DEC-012) | Dev-only local disk storage (`backend/Api/uploads/`, gitignored) behind `IFileStorageService`; served only via an authenticated, ownership-scoped admin endpoint, never a public URL | S3-or-equivalent bucket + credentials with **private** access only (no public-read bucket policy); Railway's filesystem is ephemeral/non-persistent across redeploys, so local disk storage silently loses previously uploaded photos on every redeploy — this must be swapped before production launch, not just before scale |

None of the above block Stages 0–23 of local development; all are documented here per policy and re-checked in Stage 22 (Production Preparation) and Stage 23 (Final Audit).
