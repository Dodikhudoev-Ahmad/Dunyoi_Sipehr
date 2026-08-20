import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ru from '@/i18n/locales/ru.json'
import tg from '@/i18n/locales/tg.json'
import en from '@/i18n/locales/en.json'
import { DEFAULT_LOCALE } from '@/types/domain'

// react-i18next chosen over a hand-rolled context: gives us interpolation,
// pluralization and a stable `useTranslation` hook for free. Missing keys
// fall back to `ru` per MASTER_TZ section 2 (`fallbackLng` below).
void i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    tg: { translation: tg },
    en: { translation: en },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
  returnEmptyString: false,
})

export default i18n
