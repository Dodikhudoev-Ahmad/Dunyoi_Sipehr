import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlaneTakeoff } from 'lucide-react'
import { useLocale, localizedPath } from '@/i18n/LocaleContext'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <Section withMap className="flex flex-col items-center py-32 text-center">
      <PlaneTakeoff size={40} strokeWidth={1.5} className="mb-6 text-brand" />
      <h1 className="text-3xl font-medium md:text-5xl">404</h1>
      <p className="mt-2 text-lg font-medium">{t('common.notFoundTitle')}</p>
      <p className="mt-2 max-w-md text-slate">{t('common.notFoundBody')}</p>
      <NavLink to={localizedPath(locale, '/')} className="mt-8">
        <Button>{t('common.notFoundCta')}</Button>
      </NavLink>
    </Section>
  )
}
