import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { useLocale, localizedPath } from '@/i18n/LocaleContext'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import logo from '@/assets/brand/logo.png'

const LINKS = [
  { to: '/destinations', key: 'nav.destinations' },
  { to: '/offers', key: 'nav.offers' },
  { to: '/services', key: 'nav.services' },
  { to: '/about', key: 'nav.about' },
  { to: '/testimonials', key: 'nav.testimonials' },
  { to: '/faq', key: 'nav.faq' },
  { to: '/contacts', key: 'nav.contacts' },
] as const

function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

export function Nav() {
  const { t } = useTranslation()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const scrolled = useScrolled()

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-500',
        scrolled || open
          ? 'border-b border-text/8 bg-elevated/80 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 items-center gap-4 px-6 py-5 md:py-6 xl:grid-cols-[1fr_auto_1fr] xl:px-12">
        <NavLink to={localizedPath(locale, '/')} className="flex items-center">
          <img src={logo} alt="Dunyoi Sipehr" className="h-11 w-11 shrink-0 object-contain md:h-12 md:w-12" />
        </NavLink>

        <nav className="hidden items-center gap-6 xl:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={localizedPath(locale, link.to)}
              className={({ isActive }) =>
                cn(
                  'group relative py-1 text-[13px] font-medium uppercase tracking-[0.08em] text-muted transition-colors hover:text-text',
                  isActive && 'text-text',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {t(link.key)}
                  <span
                    className={cn(
                      'absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100',
                      isActive && 'scale-x-100',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center justify-end gap-4 xl:flex">
          <LocaleSwitcher />
          <ThemeToggle />
          <NavLink to={localizedPath(locale, '/travel-request')} className="shrink-0">
            <Button size="sm" className="whitespace-nowrap">{t('nav.travelRequest')}</Button>
          </NavLink>
        </div>

        <div className="flex items-center justify-self-end gap-2 xl:hidden">
          <ThemeToggle size="md" />
          <LocaleSwitcher size="md" />
          <button
            className="flex h-11 w-11 items-center justify-center"
            aria-label={t('nav.openMenu')}
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} side="left" label={t('nav.openMenu')} panelClassName="bg-surface text-text">
        <div className="flex items-center justify-between px-6 pt-6">
          <img src={logo} alt="" aria-hidden className="h-9 w-9 shrink-0 object-contain" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('nav.closeMenu')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text/70 hover:bg-text/5 hover:text-text"
          >
            <X size={22} />
          </button>
        </div>
        <nav className="flex flex-col gap-1 overflow-y-auto px-6 pt-4 pb-4">
          {LINKS.map((link, i) => (
            <motion.div
              key={link.to}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: 'easeOut' }}
            >
              <NavLink
                to={localizedPath(locale, link.to)}
                onClick={() => setOpen(false)}
                className="block border-b border-text/8 py-3 font-display text-lg font-medium tracking-tight text-text"
              >
                {t(link.key)}
              </NavLink>
            </motion.div>
          ))}
        </nav>
        <div className="mt-auto border-t border-text/8 px-6 py-6">
          <NavLink to={localizedPath(locale, '/travel-request')} onClick={() => setOpen(false)}>
            <Button className="w-full" size="lg">
              {t('nav.travelRequest')} →
            </Button>
          </NavLink>
        </div>
      </Drawer>
    </header>
  )
}
