/**
 * Right-sizes a photo URL for the container it's actually rendered in, instead of shipping
 * whatever width the URL happened to be authored with (dev-seed/admin-entered Unsplash URLs
 * and the curated `editorialImages` URLs both used flat 1200-2000px widths regardless of
 * display size — e.g. a 1920px photo landing in a ~400px grid card). Only rewrites
 * `images.unsplash.com` URLs (the only host this catalog's photos come from — see
 * docs/BLOCKERS.md BLK-007); any other host is returned unchanged, so an admin pasting a
 * non-Unsplash image URL still works exactly as before, just without the size rewrite.
 *
 * `auto=format` asks Unsplash's imgix backend to content-negotiate AVIF/WebP for browsers that
 * support it (virtually all current browsers) instead of a flat JPEG — meaningfully smaller
 * bytes at the same visual quality, with automatic JPEG fallback for anything that doesn't.
 */
export function optimizeImageUrl(url: string, width: number, quality = 75): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url
  }
  if (parsed.hostname !== 'images.unsplash.com') return url

  parsed.searchParams.set('w', String(width))
  parsed.searchParams.set('q', String(quality))
  parsed.searchParams.set('auto', 'format')
  parsed.searchParams.delete('fm')
  if (!parsed.searchParams.has('fit')) parsed.searchParams.set('fit', 'crop')
  return parsed.toString()
}
