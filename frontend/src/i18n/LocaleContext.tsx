import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Locale } from '@/types/domain'

const LocaleContext = createContext<Locale | null>(null)

/** Provides the active locale to the subtree and keeps i18next's language in sync with it. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const { i18n } = useTranslation()

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale)
    }
    document.documentElement.lang = locale
  }, [locale, i18n])

  const value = useMemo(() => locale, [locale])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): Locale {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider')
  return ctx
}

/** Prefixes a path with the locale segment, per SITEMAP.md (ru unprefixed, tg/en prefixed). */
export function localizedPath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (locale === 'ru') return clean
  return `/${locale}${clean === '/' ? '' : clean}`
}
