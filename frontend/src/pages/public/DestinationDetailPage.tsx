import { useParams, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2 } from 'lucide-react'
import { useLocale, localizedPath } from '@/i18n/LocaleContext'
import { useDestination, useOffers } from '@/hooks/usePublicData'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { OfferCard } from '@/components/sections/OfferCard'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { editorialImages } from '@/lib/editorialImages'
import { optimizeImageUrl } from '@/lib/imageOptimize'

export function DestinationDetailPage() {
  const { slug = '' } = useParams()
  const { t } = useTranslation()
  const locale = useLocale()
  const destination = useDestination(slug, locale)
  const offers = useOffers(locale, { destinationId: destination.data?.id, pageSize: 6 })

  if (destination.isPending) {
    return (
      <>
        <PageHero image={editorialImages.destinationsHeader} eyebrow={t('nav.destinations')} title={<span className="opacity-0">.</span>} />
        <Section>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-4 aspect-16/7 w-full" />
        </Section>
      </>
    )
  }

  if (destination.isError) {
    if (destination.error.status === 404) return <NotFoundPage />
    return (
      <>
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
      <PageHero
        image={d.heroImageUrl || editorialImages.destinationsHeader}
        eyebrow={t('nav.destinations')}
        backTo={localizedPath(locale, '/destinations')}
        backLabel={t('destinations.backToList')}
        title={d.title}
        subtitle={d.summary}
      />

      <Section className="pt-0" tone="paper">
        <div className="overflow-hidden rounded-2xl">
          <img
            src={optimizeImageUrl(d.heroImageUrl, 1600)}
            alt={d.title}
            loading="lazy"
            decoding="async"
            className="aspect-16/7 w-full object-cover"
          />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="whitespace-pre-line leading-relaxed text-slate">{d.description}</p>
          </div>
          {d.highlights.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-medium">{t('destinations.highlights')}</h2>
              <ul className="space-y-2">
                {d.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand" /> {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {d.galleryUrls.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {d.galleryUrls.map((url, i) => (
              <img
                key={i}
                src={optimizeImageUrl(url, 500)}
                alt=""
                loading="lazy"
                decoding="async"
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>
        )}

        <div className="mt-14">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-medium">{t('destinations.viewOffers')}</h2>
          </div>
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

        <div className="mt-14 text-center">
          <NavLink to={localizedPath(locale, `/travel-request?destinationId=${d.id}`)}>
            <Button size="lg">{t('offers.requestThis')}</Button>
          </NavLink>
        </div>
      </Section>
    </>
  )
}
