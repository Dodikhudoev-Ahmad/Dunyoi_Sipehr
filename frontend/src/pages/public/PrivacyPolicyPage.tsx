import { useTranslation } from 'react-i18next'
import { useLocale } from '@/i18n/LocaleContext'
import { useSiteContent } from '@/hooks/usePublicData'
import { Section } from '@/components/ui/Section'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Seo } from '@/components/seo/Seo'
import { pageTitle } from '@/lib/seo'

export function PrivacyPolicyPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const content = useSiteContent('privacy-policy', locale)

  return (
    <>
      <Seo title={pageTitle(t('privacy.title'))} path="/privacy-policy" description={content.data?.body || undefined} />
      <Section withMap className="pt-16">
        <h1 className="mb-8 text-3xl font-medium md:text-5xl">{t('privacy.title')}</h1>

        {content.isPending && (
          <div className="max-w-2xl space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}
        {content.isError && <ErrorState onRetry={() => content.refetch()} />}
        {content.isSuccess && !content.data.body && <EmptyState title={t('common.empty')} />}
        {content.isSuccess && content.data.body && (
          <div className="max-w-2xl whitespace-pre-line leading-relaxed text-slate">{content.data.body}</div>
        )}
      </Section>
    </>
  )
}
