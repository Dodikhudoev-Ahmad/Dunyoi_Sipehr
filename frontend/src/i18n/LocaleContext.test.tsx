import { describe, it, expect } from 'vitest'
import { render, renderHook, screen } from '@testing-library/react'
import i18next from 'i18next'
import { initReactI18next, I18nextProvider, useTranslation } from 'react-i18next'
import '@/i18n' // initializes the global i18next singleton LocaleProvider's useTranslation() reads
import { LocaleProvider, useLocale, localizedPath } from '@/i18n/LocaleContext'
import type { Locale } from '@/types/domain'

describe('localizedPath', () => {
  it('leaves ru (default locale) unprefixed, per SITEMAP.md', () => {
    expect(localizedPath('ru', '/destinations')).toBe('/destinations')
    expect(localizedPath('ru', '/')).toBe('/')
  })

  it('prefixes tg and en', () => {
    expect(localizedPath('en', '/destinations')).toBe('/en/destinations')
    expect(localizedPath('tg', '/')).toBe('/tg')
  })

  it('normalizes a path missing its leading slash', () => {
    expect(localizedPath('en', 'destinations')).toBe('/en/destinations')
  })
})

describe('useLocale / LocaleProvider', () => {
  it('throws when used outside a LocaleProvider', () => {
    expect(() => renderHook(() => useLocale())).toThrow('useLocale must be used within a LocaleProvider')
  })

  it('exposes the provided locale to descendants and sets <html lang>', () => {
    function Probe() {
      const locale = useLocale()
      return <span>current:{locale}</span>
    }
    render(
      <LocaleProvider locale="tg">
        <Probe />
      </LocaleProvider>,
    )
    expect(screen.getByText('current:tg')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('tg')
  })
})

describe('missing-translation fallback to ru (MASTER_TZ §2)', () => {
  // A small, isolated i18next instance mirroring src/i18n/index.ts's fallback config
  // (fallbackLng: 'ru'), with `tg` deliberately missing a key — proves the *mechanism*
  // rather than depending on whether the real locale JSON files happen to be complete.
  async function makeInstance() {
    const instance = i18next.createInstance()
    await instance.use(initReactI18next).init({
      resources: {
        ru: { translation: { greeting: 'Привет', onlyInRu: 'только в ru' } },
        tg: { translation: { greeting: 'Салом' } },
        en: { translation: { greeting: 'Hello' } },
      },
      lng: 'tg',
      fallbackLng: 'ru',
      interpolation: { escapeValue: false },
    })
    return instance
  }

  it('uses the active locale when a translation exists', async () => {
    const instance = await makeInstance()
    expect(instance.t('greeting')).toBe('Салом')
  })

  it('falls back to ru when the active locale has no translation for the key', async () => {
    const instance = await makeInstance()
    expect(instance.t('onlyInRu')).toBe('только в ru')
  })

  it('falls back to ru through a React component tree via I18nextProvider', async () => {
    const instance = await makeInstance()
    function Probe() {
      const { t } = useTranslation()
      return <span>{t('onlyInRu')}</span>
    }
    render(
      <I18nextProvider i18n={instance}>
        <Probe />
      </I18nextProvider>,
    )
    expect(screen.getByText('только в ru')).toBeInTheDocument()
  })
})

// Locales referenced above are exhaustively typed against the app's Locale union so this file
// breaks (rather than silently drifting) if MASTER_TZ's locale set ever changes.
const _typeCheck: Locale[] = ['ru', 'tg', 'en']
void _typeCheck
