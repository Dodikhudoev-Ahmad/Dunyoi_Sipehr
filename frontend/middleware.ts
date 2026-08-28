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
  const { pathname } = url

  // Skip static assets, /admin, favicon, robots.txt, sitemap.xml
  if (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/admin') ||
    pathname === '/favicon.png' ||
    pathname === '/favicon.svg' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return next()
  }

  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0] && LOCALE_PREFIXES.has(segments[0]) ? segments[1] : segments[0]
  const isKnownRoute = !firstSegment || KNOWN_TOP_LEVEL_SEGMENTS.has(firstSegment)

  if (isKnownRoute) return next()

  const indexResponse = await fetch(new URL('/index.html', url.origin))
  return new Response(indexResponse.body, {
    status: 404,
    headers: indexResponse.headers,
  })
}

export const config = {
  matcher: ['/:path*'],
}
