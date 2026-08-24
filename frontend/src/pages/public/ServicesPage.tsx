import { useTranslation } from 'react-i18next'
import { useLocale } from '@/i18n/LocaleContext'
import { useServices } from '@/hooks/usePublicData'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ServicesEditorial } from '@/components/sections/ServicesEditorial'
import { Seo } from '@/components/seo/Seo'
import { pageTitle, ogImageUrl } from '@/lib/seo'
import { editorialImages } from '@/lib/editorialImages'

export function ServicesPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const services = useServices(locale)

  return (
    <>
      <Seo
        title={pageTitle(t('services.title'))}
        path="/services"
        description={t('services.subtitle')}
        image={ogImageUrl(editorialImages.servicesHeader)}
      />
      <PageHero image={editorialImages.servicesHeader} eyebrow={t('nav.services')} title={t('services.title')} subtitle={t('services.subtitle')} />
      <Section>
        {services.isPending && (
          <div className="space-y-6 border-t border-text/10 pt-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}
        {services.isError && <ErrorState onRetry={() => services.refetch()} />}
        {services.isSuccess && services.data.length === 0 && <EmptyState title={t('services.empty')} />}
        {services.isSuccess && services.data.length > 0 && <ServicesEditorial services={services.data} />}
      </Section>
    </>
  )
}
