// Build-time sitemap generator. Runs before `vite build` (see package.json "build" script) so
// `public/sitemap.xml` exists before Vite copies `public/` into `dist/`. Fetches the same public
// catalog API the site itself uses, so the sitemap always reflects real published data — never a
// hand-maintained list that drifts from the catalog.
//
// Network failures (including a cold Render free-tier instance, which can take 60-120s to wake —
// see docs/PROGRESS.md) must never fail the build: on any fetch error this falls back to writing
// a sitemap with just the static routes and logs a warning, rather than blocking deployment.

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_FILE = resolve(__dirname, '../public/sitemap.xml')

const SITE_URL = (process.env.VITE_SITE_URL || 'https://dunyoi-sipehr.vercel.app').replace(/\/$/, '')
const API_BASE = (process.env.VITE_API_BASE_URL || 'http://localhost:5091/api/v1').replace(/\/$/, '')

// ru is served unprefixed at "/"; tg/en are prefixed — mirrors src/i18n/LocaleContext.ts
// (localizedPath) and docs/SITEMAP.md exactly.
const LOCALES = ['ru', 'tg', 'en']

function localizedPath(locale, path) {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (locale === 'ru') return clean
  return `/${locale}${clean === '/' ? '' : clean}`
}

// Every static public route from docs/SITEMAP.md, excluding admin (not public-crawlable).
const STATIC_PATHS = [
  '/',
  '/destinations',
  '/offers',
  '/services',
  '/travel-request',
  '/about',
  '/faq',
  '/testimonials',
  '/contacts',
  '/privacy-policy',
]

async function fetchJson(url, { timeoutMs }) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}

/** One retry with a much longer timeout, to ride out a cold Render instance without giving up
 * on the first attempt (see the perf-stage notes in docs/PROGRESS.md: cold starts up to ~120s). */
async function fetchJsonWithRetry(url) {
  try {
    return await fetchJson(url, { timeoutMs: 20_000 })
  } catch {
    return await fetchJson(url, { timeoutMs: 130_000 })
  }
}

async function fetchAllSlugs(resource) {
  try {
    const data = await fetchJsonWithRetry(`${API_BASE}/public/${resource}?locale=ru&pageSize=500`)
    return (data.items ?? []).map((item) => item.slug).filter(Boolean)
  } catch (err) {
    console.warn(`[generate-sitemap] Failed to fetch ${resource} — omitting from sitemap:`, err.message)
    return []
  }
}

function urlEntry(loc, alternates) {
  const alternateLinks = alternates
    .map(({ locale, href }) => `    <xhtml:link rel="alternate" hreflang="${locale}" href="${href}" />`)
    .join('\n')
  return `  <url>\n    <loc>${loc}</loc>\n${alternateLinks}\n  </url>`
}

function buildEntriesForPath(path) {
  const alternates = LOCALES.map((locale) => ({
    locale,
    href: `${SITE_URL}${localizedPath(locale, path)}`,
  }))
  // One <url> per locale variant, each carrying hreflang alternates to every locale (including
  // itself, per the standard hreflang convention) so crawlers understand the ru/tg/en relationship
  // instead of treating them as unrelated duplicate pages.
  return alternates.map(({ href }) => urlEntry(href, alternates))
}

async function main() {
  const entries = STATIC_PATHS.flatMap(buildEntriesForPath)

  const [destinationSlugs, offerSlugs] = await Promise.all([fetchAllSlugs('destinations'), fetchAllSlugs('offers')])

  for (const slug of destinationSlugs) entries.push(...buildEntriesForPath(`/destinations/${slug}`))
  for (const slug of offerSlugs) entries.push(...buildEntriesForPath(`/offers/${slug}`))

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${entries.join('\n')}\n` +
    `</urlset>\n`

  writeFileSync(OUT_FILE, xml, 'utf-8')
  console.log(
    `[generate-sitemap] Wrote ${OUT_FILE} — ${STATIC_PATHS.length} static routes, ${destinationSlugs.length} destinations, ${offerSlugs.length} offers, x${LOCALES.length} locales.`,
  )
}

await main()
