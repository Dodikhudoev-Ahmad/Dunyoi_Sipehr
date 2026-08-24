/** Canonical production origin (no trailing slash) — same env var the build-time sitemap
 * generator reads (see scripts/generate-sitemap.mjs), so canonical/OG/Twitter URLs and the
 * sitemap can never drift apart. Falls back to the current Vercel deployment URL until a custom
 * domain is live (see docs/BLOCKERS.md BLK-006). */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://dunyoi-sipehr.vercel.app').replace(/\/$/, '')

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/** Consistent "Page — Dunyoi Sipehr" pattern for every page's <title>. */
export function pageTitle(title: string): string {
  return `${title} — Dunyoi Sipehr`
}

/** index.html has no static <title>/<meta name="description"> — react-helmet-async only ever
 * manages tags it rendered itself, so a static tag in the raw HTML would sit alongside (not be
 * replaced by) Helmet's per-page one, and the static tag wins per the HTML spec's "first title
 * element in tree order" rule. These two constants back a single default <Helmet> rendered once
 * at the app root (see App.tsx) instead — every public page overrides it via its own <Seo>, and
 * routes with no Seo of their own (currently just /admin/*) still get a sane fallback. */
export const DEFAULT_TITLE = 'Dunyoi Sipehr — International Flight Tickets'
export const DEFAULT_DESCRIPTION =
  'Dunyoi Sipehr — international flight ticket search and booking. Find the best routes and fares, with support through to ticket issuance.'

/** Right-sizes a photo for a social share card (1200x630, the standard og:image aspect ratio).
 * Unlike `optimizeImageUrl` (used for on-page rendering), this forces a flat JPEG rather than
 * `auto=format` AVIF/WebP negotiation — social platforms' link-preview scrapers (Facebook,
 * Twitter/X, Telegram, etc.) fetch the image directly with no content-negotiation, so a
 * universally-supported format matters more here than shaving bytes. Only rewrites
 * `images.unsplash.com` URLs; any other host is returned unchanged. */
export function ogImageUrl(url: string): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url
  }
  if (parsed.hostname !== 'images.unsplash.com') return url

  parsed.searchParams.set('w', '1200')
  parsed.searchParams.set('h', '630')
  parsed.searchParams.set('fit', 'crop')
  parsed.searchParams.set('fm', 'jpg')
  parsed.searchParams.set('q', '80')
  parsed.searchParams.delete('auto')
  return parsed.toString()
}
