# AeroTravel — Frontend

Public marketing site + admin CMS for AeroTravel, a boutique international travel agency.
React 18 + TypeScript (strict) + Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form + Zod, Axios, Motion, lucide-react.

See `/docs` at the repo root (`MASTER_TZ.md`, `SITEMAP.md`, `API_CONTRACT.md`, `DOMAIN_MODEL.md`, `DESIGN_BIBLE.md`) for the product/architecture spec this app implements.

## Environment setup

Copy `.env.example` to `.env` and adjust if the backend isn't at the default URL:

```bash
cp .env.example .env
```

- `VITE_API_BASE_URL` — base URL of the backend API. Defaults to `http://localhost:5000/api/v1` when unset (see `docs/BLOCKERS.md` BLK-003).

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # type-check (tsc -b) + production build
npm run lint      # oxlint
npm run preview   # preview the production build locally
```

## Structure

- `src/api/` — typed Axios client + one module per backend resource (never call axios directly from a component)
- `src/i18n/` — react-i18next setup (`ru` default/fallback, `tg`, `en`) + `LocaleContext` for route-driven locale
- `src/components/ui/` — design system primitives (Button, Card, Badge, Input family, Section, AeroMapBackground, Skeleton, EmptyState, ErrorState, Toast)
- `src/components/sections` / `src/components/layout` — composed public-site building blocks (Nav, Footer, cards)
- `src/pages/public/` — public site pages
- `src/admin/` — admin CMS (layout, auth, CRUD pages per entity, Travel Requests board, Audit Log)
- `src/routes/` — route tree assembly (locale-prefixed public routes + `/admin/*`)

## i18n / routing

Three locales per `docs/MASTER_TZ.md` section 2: `ru` (default, unprefixed — `/`, `/destinations`, …), `tg` (`/tg/...`), `en` (`/en/...`). Missing translation keys fall back to `ru` via i18next's `fallbackLng`. Admin UI (`/admin/*`) is ru-only and not locale-prefixed.

## Auth flow

Bearer access token (held in memory / sessionStorage via `src/store/authStore.ts`) + httpOnly `refreshToken` cookie. An Axios response interceptor retries once via `POST /auth/refresh` on a 401, then redirects to `/admin/login` if that also fails.

## Deployment

`netlify.toml` builds with `npm run build`, publishes `dist/`, and redirects all paths to `index.html` for SPA routing (locale-prefixed public routes + `/admin/*`). Set `VITE_API_BASE_URL` in the Netlify site's environment variables to point at the deployed backend (see `docs/BLOCKERS.md` BLK-003).
