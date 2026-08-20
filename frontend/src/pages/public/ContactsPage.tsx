import { useTranslation } from 'react-i18next'
import { Mail, Phone, MapPin } from 'lucide-react'
import { useLocale } from '@/i18n/LocaleContext'
import { useSiteContent } from '@/hooks/usePublicData'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { editorialImages } from '@/lib/editorialImages'

export function ContactsPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const content = useSiteContent('contacts', locale)

  return (
    <>
      <PageHero image={editorialImages.contactsHeader} eyebrow={t('nav.contacts')} title={t('contacts.title')} />
      <Section>
        {content.isPending && <Skeleton className="h-40 w-full max-w-xl" />}
        {content.isError && <ErrorState onRetry={() => content.refetch()} />}
        {content.isSuccess && (
          <Card className="max-w-xl p-8">
            <div className="space-y-4 text-slate">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-brand" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate/70">{t('contacts.address')}</p>
                  <p className="text-text">{content.data.body || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 shrink-0 text-brand" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate/70">{t('contacts.phone')}</p>
                  <p className="text-text">+992 00 000 0000</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 shrink-0 text-brand" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate/70">{t('contacts.email')}</p>
                  <p className="text-text">hello@dunyoisipehr.example</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </Section>
    </>
  )
}
