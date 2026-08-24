/** Canonical production origin (no trailing slash) — same env var the build-time sitemap
 * generator reads (see scripts/generate-sitemap.mjs), so canonical/OG/Twitter URLs and the
 * sitemap can never drift apart. Falls back to the current Vercel deployment URL until a custom
 * domain is live (see docs/BLOCKERS.md BLK-006). */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://dunyoi-sipehr.vercel.app').replace(/\/$/, '')

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/** Consistent "Page — Dunyoi Sipehr" pattern for every page's <title>, matching the brand suffix
 * already used in index.html's static default title. */
export function pageTitle(title: string): string {
  return `${title} — Dunyoi Sipehr`
}
