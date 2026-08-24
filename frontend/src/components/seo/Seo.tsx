import { Helmet } from 'react-helmet-async'
import { useLocale, localizedPath } from '@/i18n/LocaleContext'
import { absoluteUrl, DEFAULT_DESCRIPTION } from '@/lib/seo'

interface SeoProps {
  /** Full <title> text, e.g. via `pageTitle()` — not just the page name. */
  title: string
  /** Locale-unprefixed path, e.g. '/destinations' or `/offers/${slug}` — localizedPath() applies
   * the current locale's prefix (or lack thereof, for ru) before building the canonical URL. */
  path: string
  /** Plain-text summary for <meta name="description"> and og:description/twitter:description. */
  description?: string
  /** Absolute image URL for og:image/twitter:image. Falls back to the site default when unset. */
  image?: string
  /** og:type — 'website' for most pages, 'product' isn't a real OG type so offer pages still use
   * 'website' (schema.org Product/Offer JSON-LD carries the commerce semantics instead). */
  type?: 'website' | 'article'
  /** Keeps a page out of search indexes (e.g. NotFoundPage) without blocking crawling. */
  noindex?: boolean
  /** One or more JSON-LD objects, each rendered as its own <script type="application/ld+json">. */
  jsonLd?: object | object[]
}

export function Seo({ title, path, description = DEFAULT_DESCRIPTION, image, type = 'website', noindex, jsonLd }: SeoProps) {
  const locale = useLocale()
  const canonical = absoluteUrl(localizedPath(locale, path))
  const jsonLdList = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:site_name" content="Dunyoi Sipehr" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content={locale} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {jsonLdList.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  )
}
