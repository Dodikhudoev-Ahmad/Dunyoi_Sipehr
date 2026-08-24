import { useParams, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Star, ShieldCheck, Clock, type LucideIcon } from 'lucide-react'
import { useLocale, localizedPath } from '@/i18n/LocaleContext'
import { useDestination, useOffers } from '@/hooks/usePublicData'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { OfferCard } from '@/components/sections/OfferCard'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { Seo } from '@/components/seo/Seo'
import { pageTitle, ogImageUrl } from '@/lib/seo'
import { editorialImages } from '@/lib/editorialImages'
import { optimizeImageUrl } from '@/lib/imageOptimize'
import { cn } from '@/lib/cn'

const HIGHLIGHT_ICONS: LucideIcon[] = [MapPin, Star, ShieldCheck, Clock]

export function DestinationDetailPage() {
  const { slug = '' } = useParams()
  const { t } = useTranslation()
  const locale = useLocale()
  const destination = useDestination(slug, locale)
  const offers = useOffers(locale, { destinationId: destination.data?.id, pageSize: 6 })

  if (destination.isPending) {
    return (
      <>
        <Seo title={pageTitle(t('nav.destinations'))} path={`/destinations/${slug}`} />
        <PageHero image={editorialImages.destinationsHeader} eyebrow={t('nav.destinations')} title={<span className="opacity-0">.</span>} />
        <Section className="pt-10 md:pt-0" tone="paper">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-14">
            <div className="space-y-3 lg:col-span-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </Section>
      </>
    )
  }

  if (destination.isError) {
    if (destination.error.status === 404) return <NotFoundPage />
    return (
      <>
        <Seo title={pageTitle(t('common.error'))} path={`/destinations/${slug}`} noindex />
        <PageHero image={editorialImages.destinationsHeader} eyebrow={t('nav.destinations')} title={t('common.error')} />
        <Section>
          <ErrorState onRetry={() => destination.refetch()} />
        </Section>
      </>
    )
  }

  const d = destination.data

  return (
    <>
      <Seo
        title={pageTitle(d.title)}
        path={`/destinations/${slug}`}
        description={d.summary}
        image={ogImageUrl(d.heroImageUrl)}
      />
      {/* Full-bleed hero — the destination's own photo, once. Nothing below repeats it. */}
      <PageHero
        image={d.heroImageUrl || editorialImages.destinationsHeader}
        eyebrow={t('nav.destinations')}
        backTo={localizedPath(locale, '/destinations')}
        backLabel={t('destinations.backToList')}
        title={d.title}
        subtitle={d.summary}
      />

      <Section className="pt-10 md:pt-0" tone="paper">
        {/* About + Highlights: description reads as a real editorial paragraph (larger type,
            generous line-height) rather than competing for space with a sidebar list — the
            highlights instead live in their own card, each one a small icon-badged chip rather
            than a plain bullet, so the two columns read as distinct, deliberate blocks. */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-14">
          <div className="lg:col-span-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">{t('destinations.about')}</p>
            <p className="mt-4 max-w-2xl whitespace-pre-line text-[17px] leading-relaxed text-slate">{d.description}</p>
          </div>

          {d.highlights.length > 0 && (
            <Card className="p-6 lg:sticky lg:top-28">
              <h2 className="mb-5 text-lg font-medium">{t('destinations.highlights')}</h2>
              <div className="space-y-3">
                {d.highlights.map((h, i) => {
                  const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length] ?? MapPin
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-brand-subtle/40 px-4 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-light text-primary">
                        <Icon size={16} strokeWidth={1.75} />
                      </span>
                      <span className="text-sm leading-snug text-text">{h}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Gallery: edge-to-edge, equal-height photos in a row that adapts to however many exist
            (1, 2, or 3+) — never a single small square floating in otherwise-empty space. */}
        {d.galleryUrls.length > 0 && (
          <div
            className={cn(
              'mt-16 grid gap-4 border-t border-text/10 pt-16',
              d.galleryUrls.length === 1 && 'grid-cols-1',
              d.galleryUrls.length === 2 && 'grid-cols-1 sm:grid-cols-2',
              d.galleryUrls.length >= 3 && 'grid-cols-1 sm:grid-cols-3',
            )}
          >
            {d.galleryUrls.map((url, i) => (
              <img
                key={i}
                src={optimizeImageUrl(url, 900)}
                alt={d.galleryUrls.length > 1 ? `${d.title} ${i + 1}` : d.title}
                loading="lazy"
                decoding="async"
                className="aspect-4/3 w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        )}

        {/* Offers: the same responsive card grid used on /offers — never a single card
            stretched full width. */}
        <div className="mt-16 border-t border-text/10 pt-16">
          <h2 className="mb-8 text-2xl font-medium">{t('destinations.viewOffers')}</h2>
          {offers.isPending && <Skeleton className="h-40 w-full" />}
          {offers.isSuccess && offers.data.items.length === 0 && <EmptyState title={t('offers.empty')} />}
          {offers.isSuccess && offers.data.items.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {offers.data.items.map((o, i) => (
                <OfferCard key={o.id} offer={o} index={i} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-16 text-center">
          <NavLink to={localizedPath(locale, `/travel-request?destinationId=${d.id}`)}>
            <Button size="lg">{t('offers.requestThis')}</Button>
          </NavLink>
        </div>
      </Section>
    </>
  )
}
