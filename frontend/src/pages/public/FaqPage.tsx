import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { useLocale } from '@/i18n/LocaleContext'
import { useFaq } from '@/hooks/usePublicData'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { cn } from '@/lib/cn'
import { editorialImages } from '@/lib/editorialImages'

export function FaqPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const faq = useFaq(locale)
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <>
      <PageHero image={editorialImages.faqHeader} eyebrow={t('nav.faq')} title={t('faqPage.title')} />
      <Section>
        {faq.isPending && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}
        {faq.isError && <ErrorState onRetry={() => faq.refetch()} />}
        {faq.isSuccess && faq.data.length === 0 && <EmptyState title={t('faqPage.empty')} />}
        {faq.isSuccess && faq.data.length > 0 && (
          <div className="mx-auto max-w-3xl divide-y divide-text/8 rounded-2xl border border-text/8 bg-elevated/60">
            {faq.data.map((item) => {
              const isOpen = openId === item.id
              return (
                <div key={item.id}>
                  <button
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-medium">{item.question}</span>
                    <ChevronDown size={18} className={cn('shrink-0 text-slate transition-transform', isOpen && 'rotate-180')} />
                  </button>
                  {isOpen && <p className="px-5 pb-4 text-sm leading-relaxed text-slate">{item.answer}</p>}
                </div>
              )
            })}
          </div>
        )}
      </Section>
    </>
  )
}
