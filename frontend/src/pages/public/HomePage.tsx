import { useTranslation } from 'react-i18next'
import { useLocale } from '@/i18n/LocaleContext'
import { useServices } from '@/hooks/usePublicData'
import { Seo } from '@/components/seo/Seo'
import { pageTitle, ogImageUrl } from '@/lib/seo'
import { editorialImages } from '@/lib/editorialImages'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { HeroSection } from '@/components/sections/HeroSection'
import { DestinationsEditorial } from '@/components/sections/DestinationsEditorial'
import { BrandStatementBand } from '@/components/sections/BrandStatementBand'
import { CuratedOffers } from '@/components/sections/CuratedOffers'
import { ServicesEditorial } from '@/components/sections/ServicesEditorial'
import { AboutSection } from '@/components/sections/AboutSection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { FinalCta } from '@/components/sections/FinalCta'

export function HomePage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const services = useServices(locale)

  return (
    <>
      <Seo
        title={pageTitle(t('home.heroTitle').replace(/\s*\n\s*/g, ' '))}
        path="/"
        description={t('home.heroSubtitle')}
        image={ogImageUrl(editorialImages.hero)}
      />
      <HeroSection />
      <DestinationsEditorial />
      <BrandStatementBand />
      <CuratedOffers />

      <Section tone="paper" className="pt-20 md:pt-28">
        <SectionHeading
          eyebrow={t('services.eyebrow')}
          title={t('home.servicesTeaser')}
          subtitle={t('home.servicesTeaserSubtitle')}
        />

        {services.isPending && (
          <div className="space-y-6 border-t border-text/10 pt-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}
        {services.isError && <ErrorState onRetry={() => services.refetch()} />}
        {services.isSuccess && services.data.length === 0 && <EmptyState title={t('services.empty')} />}
        {services.isSuccess && services.data.length > 0 && <ServicesEditorial services={services.data} />}
      </Section>

      <AboutSection />
      <TestimonialsSection />
      <FinalCta />
    </>
  )
}
