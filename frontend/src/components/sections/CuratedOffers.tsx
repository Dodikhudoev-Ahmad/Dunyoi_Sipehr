import { useTranslation } from 'react-i18next'
import { useLocale, localizedPath } from '@/i18n/LocaleContext'
import { useOffers } from '@/hooks/usePublicData'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { SkeletonCardGrid } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { OfferCard } from '@/components/sections/OfferCard'

export function CuratedOffers() {
  const { t } = useTranslation()
  const locale = useLocale()
  const offers = useOffers(locale, { featured: true, pageSize: 3 })

  return (
    <Section tone="paper" className="pt-20 md:pt-28">
      <SectionHeading
        eyebrow={t('offers.eyebrow')}
        title={t('home.featuredOffers')}
        linkTo={localizedPath(locale, '/offers')}
        linkLabel={t('offers.backToList')}
      />

      {offers.isPending && <SkeletonCardGrid />}
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
  )
}
