import { useTranslation } from 'react-i18next'
import { useLocale } from '@/i18n/LocaleContext'
import { useTestimonials } from '@/hooks/usePublicData'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { SkeletonCardGrid } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { TestimonialCard } from '@/components/sections/TestimonialCard'
import { Seo } from '@/components/seo/Seo'
import { pageTitle } from '@/lib/seo'
import { editorialImages } from '@/lib/editorialImages'

export function TestimonialsPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const testimonials = useTestimonials(locale)

  return (
    <>
      <Seo title={pageTitle(t('testimonialsPage.title'))} path="/testimonials" />
      <PageHero image={editorialImages.brandStatement} eyebrow={t('nav.testimonials')} title={t('testimonialsPage.title')} />
      <Section>
        {testimonials.isPending && <SkeletonCardGrid count={6} />}
        {testimonials.isError && <ErrorState onRetry={() => testimonials.refetch()} />}
        {testimonials.isSuccess && testimonials.data.length === 0 && <EmptyState title={t('testimonialsPage.empty')} />}
        {testimonials.isSuccess && testimonials.data.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.data.map((testimonial, i) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} index={i} />
            ))}
          </div>
        )}
      </Section>
    </>
  )
}
