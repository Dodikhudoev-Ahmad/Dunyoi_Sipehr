import { useTranslation } from 'react-i18next'
import { useLocale } from '@/i18n/LocaleContext'
import { useDestinations } from '@/hooks/usePublicData'
import { Seo } from '@/components/seo/Seo'
import { pageTitle, ogImageUrl } from '@/lib/seo'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { SkeletonCardGrid } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { DestinationCard } from '@/components/sections/DestinationCard'
import { editorialImages } from '@/lib/editorialImages'

export function DestinationsListPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const destinations = useDestinations(locale, { pageSize: 24 })

  return (
    <>
      <Seo
        title={pageTitle(t('destinations.title'))}
        path="/destinations"
        description={t('destinations.subtitle')}
        image={ogImageUrl(editorialImages.destinationsHeader)}
      />
      <PageHero
        image={editorialImages.destinationsHeader}
        eyebrow={t('nav.destinations')}
        title={t('destinations.title')}
        subtitle={t('destinations.subtitle')}
      />
      <Section>
        {destinations.isPending && <SkeletonCardGrid count={6} />}
        {destinations.isError && <ErrorState onRetry={() => destinations.refetch()} />}
        {destinations.isSuccess && destinations.data.items.length === 0 && <EmptyState title={t('destinations.empty')} />}
        {destinations.isSuccess && destinations.data.items.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.data.items.map((d, i) => (
              <DestinationCard key={d.id} destination={d} index={i} />
            ))}
          </div>
        )}
      </Section>
    </>
  )
}
