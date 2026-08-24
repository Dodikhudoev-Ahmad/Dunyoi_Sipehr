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
 * element in tree order" rule. `DEFAULT_DESCRIPTION` backs Seo's own default (every public route
 * renders one); `DEFAULT_TITLE` backs AdminApp's single default <Helmet> (admin pages render no
 * <Seo> of their own — see AdminApp.tsx for why a root-level default in App.tsx doesn't work). */
export const DEFAULT_TITLE = 'Dunyoi Sipehr — International Flight Tickets'
export const DEFAULT_DESCRIPTION =
  'Dunyoi Sipehr — international flight ticket search and booking. Find the best routes and fares, with support through to ticket issuance.'

/** Single source of truth for the org's public contact details — also used by Footer.tsx, so the
 * Organization JSON-LD (below) can never drift from what's actually displayed on the page. */
export const SITE_CONTACT = {
  name: 'Dunyoi Sipehr',
  email: 'dunhoisipeht.tj@gmail.com',
  phone: '+992006773458',
  phoneDisplay: '+992 00 677 34 58',
  addressLocality: 'Dushanbe',
  addressCountry: 'TJ',
}

/** Rendered on every page (see Seo.tsx) — schema.org Organization, identifying the business
 * itself rather than any one page's content. `logoUrl` is passed in rather than imported here
 * since the logo is a Vite-processed asset (hashed filename resolved at import time in the
 * calling component), not a static path this lib module can know ahead of time. */
export function organizationJsonLd(logoUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONTACT.name,
    url: SITE_URL,
    logo: absoluteUrl(logoUrl),
    telephone: SITE_CONTACT.phone,
    email: SITE_CONTACT.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE_CONTACT.addressLocality,
      addressCountry: SITE_CONTACT.addressCountry,
    },
  }
}

/** schema.org Product+Offer for a single fare — Product is the pragmatic choice for a priced,
 * bookable listing (name/image/price/currency/availability all map directly), which is what an
 * "offer" (fare) page actually is; TravelAgency describes the business as a whole (already
 * covered by the Organization schema every page carries) rather than one specific listing. */
export function offerProductJsonLd(offer: {
  title: string
  summary: string
  priceFrom: number
  currency: string
  image?: string | null
}, canonicalUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: offer.title,
    description: offer.summary,
    ...(offer.image ? { image: [offer.image] } : {}),
    url: canonicalUrl,
    offers: {
      '@type': 'Offer',
      price: offer.priceFrom,
      // The API serializes Currency by its C# member name ("Usd"), not the ISO 4217 code
      // schema.org's priceCurrency requires ("USD") — same quirk src/lib/currency.ts already
      // normalizes for display; normalize here too rather than assuming the casing matches.
      priceCurrency: offer.currency.toUpperCase(),
      availability: 'https://schema.org/InStock',
      url: canonicalUrl,
    },
  }
}

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
