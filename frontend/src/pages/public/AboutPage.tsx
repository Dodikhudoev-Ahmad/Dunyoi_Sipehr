import { useTranslation } from 'react-i18next'
import { useLocale } from '@/i18n/LocaleContext'
import { useSiteContent } from '@/hooks/usePublicData'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { editorialImages } from '@/lib/editorialImages'

export function AboutPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const content = useSiteContent('about-us', locale)

  return (
    <>
      <PageHero image={editorialImages.about} eyebrow={t('nav.about')} title={t('about.title')} />
      <Section>
        {content.isPending && (
          <div className="max-w-2xl space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
        {content.isError && <ErrorState onRetry={() => content.refetch()} />}
        {content.isSuccess && !content.data.body && !content.data.title && <EmptyState title={t('common.empty')} />}
        {content.isSuccess && (content.data.body || content.data.title) && (
          <div className="max-w-2xl whitespace-pre-line leading-relaxed text-slate">
            {content.data.title && <h2 className="mb-4 text-xl font-medium text-text">{content.data.title}</h2>}
            {content.data.body}
          </div>
        )}
      </Section>
    </>
  )
}
