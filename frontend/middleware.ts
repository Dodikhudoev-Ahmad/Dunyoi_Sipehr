// Vercel Routing Middleware (framework-agnostic — this is a Vite SPA, not Next.js, but the
// `middleware.ts` file convention works regardless of framework, runtime "edge" by default:
// https://vercel.com/docs/routing-middleware). Must live at the project root, same level as
// package.json/vercel.json — which is `frontend/`, the Vercel project root for this app.
//
// Problem this solves: vercel.json rewrites every path to /index.html for client-side routing
// (React Router), so a nonexistent URL still gets HTTP 200 from Vercel — the browser only learns
// it's a "real" 404 once React Router's catch-all route (`path="*"`, see
// src/routes/publicRoutes.tsx) renders NotFoundPage client-side. That's invisible to crawlers and
// tools that only check the status code (Google Search Console flags this as a "soft 404").
//
// Fix: check the request path against the known top-level public route segments before the SPA
// rewrite happens. A match falls through to the normal 200 SPA response; anything else gets the
// same index.html body (so React Router still renders the friendly NotFoundPage) but with a real
// 404 status. Only the top-level segment is validated, not full destination/offer slugs — doing a
// slug-existence check here would mean an extra API round-trip on every single page request
// (added latency for all visitors) just to catch a comparatively rare case; those already render
// correctly as a 404 *page* client-side (DestinationDetailPage/OfferDetailPage check
// `error.status === 404` and return NotFoundPage — see those files), so the only remaining gap for
// an unknown slug is the HTTP status code itself, not a wrong or broken page.

import { next } from '@vercel/functions'

const LOCALE_PREFIXES = new Set(['en', 'tg'])

const KNOWN_TOP_LEVEL_SEGMENTS = new Set([
  'destinations',
  'offers',
  'services',
  'travel-request',
  'about',
  'faq',
  'testimonials',
  'contacts',
  'privacy-policy',
])

export default async function middleware(request: Request) {
  const url = new URL(request.url)
  const segments = url.pathname.split('/').filter(Boolean)

  // First segment might be a locale prefix (/en/..., /tg/...) — the route we actually need to
  // validate is the one after it. `ru` is unprefixed, so an empty/locale-only path is the
  // homepage, always known.
  const firstSegment = segments[0] && LOCALE_PREFIXES.has(segments[0]) ? segments[1] : segments[0]

  const isKnownRoute = !firstSegment || KNOWN_TOP_LEVEL_SEGMENTS.has(firstSegment)
  if (isKnownRoute) return next() // continue to Vercel's normal rewrite (vercel.json), 200

  // Unknown top-level path: serve the exact same SPA shell (so React Router's catch-all route
  // still renders NotFoundPage), but with a real 404 status this time.
  const indexResponse = await fetch(new URL('/index.html', url.origin))
  return new Response(indexResponse.body, {
    status: 404,
    headers: indexResponse.headers,
  })
}

export const config = {
  // Skip static assets (hashed JS/CSS/images under /assets/, plus the top-level static files) and
  // /admin/* — the admin SPA isn't part of this public-route whitelist and isn't crawled anyway
  // (robots.txt disallows /admin/); a real 404 there isn't worth the added complexity.
  matcher: ['/(?:(?!assets/|admin|favicon\\.(?:png|svg)|robots\\.txt|sitemap\\.xml).*)'],
}
