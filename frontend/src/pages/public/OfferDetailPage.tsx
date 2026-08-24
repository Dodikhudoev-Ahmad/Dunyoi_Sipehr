import { useParams, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Clock } from 'lucide-react'
import { useLocale, localizedPath } from '@/i18n/LocaleContext'
import { useOffer } from '@/hooks/usePublicData'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { Seo } from '@/components/seo/Seo'
import { pageTitle, ogImageUrl } from '@/lib/seo'
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
        <Seo title={pageTitle(t('nav.offers'))} path={`/offers/${slug}`} />
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
        <Seo title={pageTitle(t('common.error'))} path={`/offers/${slug}`} noindex />
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

  const hasFareDetails = Boolean(o.durationDays || o.validUntilUtc)

  return (
    <>
      <Seo
        title={pageTitle(o.title)}
        path={`/offers/${slug}`}
        description={o.summary}
        image={cover ? ogImageUrl(cover) : undefined}
      />
      {/* The cover photo lives here, in the hero banner, only — no second full-width repeat of
          it below (that was the reported bug: the same image rendered twice in a row). Any
          additional photos become a compact gallery grid instead. */}
      <PageHero
        image={cover ?? editorialImages.offersHeader}
        eyebrow={t('nav.offers')}
        backTo={localizedPath(locale, '/offers')}
        backLabel={t('offers.backToList')}
        title={o.title}
        subtitle={o.summary}
      />

      <Section className="pt-0" tone="paper">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-14">
          <div className="lg:col-span-2">
            <p className="max-w-2xl whitespace-pre-line leading-relaxed text-slate">{o.description}</p>

            {gallery.length > 1 && (
              <div className="mt-10 grid grid-cols-2 gap-4 border-t border-text/10 pt-10 sm:grid-cols-3">
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
          </div>

          {/* Fare details card — price/validity/duration as structured, styled rows instead of
              plain text stacked in the hero overlay, matching the site's Card language. */}
          <div>
            <Card className="p-6 lg:sticky lg:top-28">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">{t('offers.detailsTitle')}</p>
              <p className="mt-3 font-display text-3xl font-medium leading-tight text-text md:text-4xl">
                {t('offers.priceFrom')} {currency}{o.priceFrom.toLocaleString(locale)}
              </p>
              <p className="mt-1.5 text-sm text-slate">{o.summary}</p>

              {hasFareDetails && (
                <div className="mt-6 space-y-3 border-t border-text/10 pt-6 text-sm text-slate">
                  {o.durationDays && (
                    <div className="flex items-center gap-2.5">
                      <CalendarDays size={16} className="shrink-0 text-brand" />
                      <span>{t('offers.duration', { count: o.durationDays })}</span>
                    </div>
                  )}
                  {o.validUntilUtc && (
                    <div className="flex items-center gap-2.5">
                      <Clock size={16} className="shrink-0 text-brand" />
                      <span>{t('offers.validUntil')} {new Date(o.validUntilUtc).toLocaleDateString(locale)}</span>
                    </div>
                  )}
                </div>
              )}

              <NavLink to={localizedPath(locale, `/travel-request?offerId=${o.id}`)} className="mt-8 block">
                <Button size="lg" className="w-full">
                  {t('offers.requestThis')}
                </Button>
              </NavLink>
            </Card>
          </div>
        </div>
      </Section>
    </>
  )
}
