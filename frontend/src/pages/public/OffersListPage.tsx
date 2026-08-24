import { useTranslation } from 'react-i18next'
import { useLocale } from '@/i18n/LocaleContext'
import { useOffers } from '@/hooks/usePublicData'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { SkeletonCardGrid } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { OfferCard } from '@/components/sections/OfferCard'
import { Seo } from '@/components/seo/Seo'
import { pageTitle, ogImageUrl } from '@/lib/seo'
import { editorialImages } from '@/lib/editorialImages'

export function OffersListPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const offers = useOffers(locale, { pageSize: 24 })

  return (
    <>
      <Seo
        title={pageTitle(t('offers.title'))}
        path="/offers"
        description={t('offers.subtitle')}
        image={ogImageUrl(editorialImages.offersHeader)}
      />
      <PageHero image={editorialImages.offersHeader} eyebrow={t('nav.offers')} title={t('offers.title')} subtitle={t('offers.subtitle')} />
      <Section>
        {offers.isPending && <SkeletonCardGrid count={6} />}
        {offers.isError && <ErrorState onRetry={() => offers.refetch()} />}
        {offers.isSuccess && offers.data.items.length === 0 && <EmptyState title={t('offers.empty')} />}
        {offers.isSuccess && offers.data.items.length > 0 && (
          <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {offers.data.items.map((o, i) => (
              <OfferCard key={o.id} offer={o} index={i} />
            ))}
          </div>
        )}
      </Section>
    </>
  )
}
