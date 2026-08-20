import { useParams, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Clock } from 'lucide-react'
import { useLocale, localizedPath } from '@/i18n/LocaleContext'
import { useOffer } from '@/hooks/usePublicData'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { currencySymbol } from '@/lib/currency'
import { editorialImages } from '@/lib/editorialImages'
import { optimizeImageUrl } from '@/lib/imageOptimize'

export function OfferDetailPage() {
  const { slug = '' } = useParams()
  const { t } = useTranslation()
  const locale = useLocale()
  const offer = useOffer(slug, locale)

  if (offer.isPending) {
    return (
      <>
        <PageHero image={editorialImages.offersHeader} eyebrow={t('nav.offers')} title={<span className="opacity-0">.</span>} />
        <Section>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-4 aspect-16/7 w-full" />
        </Section>
      </>
    )
  }

  if (offer.isError) {
    if (offer.error.status === 404) return <NotFoundPage />
    return (
      <>
        <PageHero image={editorialImages.offersHeader} eyebrow={t('nav.offers')} title={t('common.error')} />
        <Section>
          <ErrorState onRetry={() => offer.refetch()} />
        </Section>
      </>
    )
  }

  const o = offer.data
  const currency = currencySymbol(t, o.currency)
  const gallery = o.galleryUrls ?? []
  const cover = gallery[0]

  return (
    <>
      <PageHero
        image={cover ?? editorialImages.offersHeader}
        eyebrow={t('nav.offers')}
        backTo={localizedPath(locale, '/offers')}
        backLabel={t('offers.backToList')}
        title={o.title}
        subtitle={o.summary}
      >
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <span className="text-2xl font-semibold text-white">
            {t('offers.priceFrom')} {currency}{o.priceFrom.toLocaleString(locale)}
          </span>
          {o.durationDays && (
            <span className="flex items-center gap-1 text-sm text-white/75">
              <CalendarDays size={15} /> {t('offers.duration', { count: o.durationDays })}
            </span>
          )}
          {o.validUntilUtc && (
            <span className="flex items-center gap-1 text-sm text-white/75">
              <Clock size={15} /> {t('offers.validUntil')} {new Date(o.validUntilUtc).toLocaleDateString(locale)}
            </span>
          )}
        </div>
      </PageHero>

      <Section className="pt-0" tone="paper">
        {cover && (
          <div className="overflow-hidden rounded-2xl">
            <img
              src={optimizeImageUrl(cover, 1600)}
              alt={o.title}
              loading="lazy"
              decoding="async"
              className="aspect-16/7 w-full object-cover"
            />
          </div>
        )}

        <p className="mt-10 max-w-3xl whitespace-pre-line leading-relaxed text-slate">{o.description}</p>

        {gallery.length > 1 && (
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {gallery.slice(1).map((url, i) => (
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

        <div className="mt-14 text-center">
          <NavLink to={localizedPath(locale, `/travel-request?offerId=${o.id}`)}>
            <Button size="lg">{t('offers.requestThis')}</Button>
          </NavLink>
        </div>
      </Section>
    </>
  )
}
