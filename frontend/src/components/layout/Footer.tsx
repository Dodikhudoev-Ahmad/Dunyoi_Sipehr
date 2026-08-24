import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, MapPin } from 'lucide-react'
import { useLocale, localizedPath } from '@/i18n/LocaleContext'
import { SITE_CONTACT } from '@/lib/seo'
import logo from '@/assets/brand/logo.png'

export function Footer() {
  const { t } = useTranslation()
  const locale = useLocale()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 bg-dark text-white">
      <div className="mx-auto max-w-[1440px] px-6 pb-14 pt-20 md:pt-28 lg:px-12">
        <div className="grid grid-cols-1 gap-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5 font-display text-2xl font-medium tracking-tight">
              <img src={logo} alt="" aria-hidden className="h-10 w-10 shrink-0 object-contain" />
              Dunyoi Sipehr
            </div>
            <p className="mt-5 max-w-[26ch] text-[15px] leading-relaxed text-white/55">{t('footer.tagline')}</p>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-sage">{t('footer.quickLinks')}</h3>
            <ul className="space-y-3 text-[15px] text-white/70">
              <li><NavLink to={localizedPath(locale, '/destinations')} className="transition-colors hover:text-white">{t('nav.destinations')}</NavLink></li>
              <li><NavLink to={localizedPath(locale, '/offers')} className="transition-colors hover:text-white">{t('nav.offers')}</NavLink></li>
              <li><NavLink to={localizedPath(locale, '/services')} className="transition-colors hover:text-white">{t('nav.services')}</NavLink></li>
              <li><NavLink to={localizedPath(locale, '/about')} className="transition-colors hover:text-white">{t('nav.about')}</NavLink></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-sage">{t('footer.legal')}</h3>
            <ul className="space-y-3 text-[15px] text-white/70">
              <li><NavLink to={localizedPath(locale, '/faq')} className="transition-colors hover:text-white">{t('nav.faq')}</NavLink></li>
              <li><NavLink to={localizedPath(locale, '/privacy-policy')} className="transition-colors hover:text-white">{t('privacy.title')}</NavLink></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-sage">{t('contacts.title')}</h3>
            <ul className="space-y-3 text-[15px] text-white/70">
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="text-sage" />
                <a href={`mailto:${SITE_CONTACT.email}`} className="transition-colors hover:text-white">{SITE_CONTACT.email}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="text-sage" />
                <a href={`tel:${SITE_CONTACT.phone}`} className="transition-colors hover:text-white">{SITE_CONTACT.phoneDisplay}</a>
              </li>
              <li className="flex items-center gap-2.5"><MapPin size={15} className="text-sage" /> Dushanbe, Tajikistan</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/40 sm:flex-row sm:items-center">
          <span>&copy; {year} Dunyoi Sipehr. {t('footer.rights')}</span>
          <span className="uppercase tracking-[0.14em]">Dushanbe, Tajikistan</span>
        </div>
      </div>
    </footer>
  )
}
