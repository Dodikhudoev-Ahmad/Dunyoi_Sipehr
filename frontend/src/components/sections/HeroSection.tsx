import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useLocale, localizedPath } from '@/i18n/LocaleContext'
import { AeroMapBackground } from '@/components/ui/AeroMapBackground'
import { FlightRouteMap } from '@/components/sections/FlightRouteMap'
import { Button } from '@/components/ui/Button'
import { editorialImages } from '@/lib/editorialImages'
import { optimizeImageUrl } from '@/lib/imageOptimize'

export function HeroSection() {
  const { t } = useTranslation()
  const locale = useLocale()

  return (
    <section className="relative flex min-h-[88svh] items-end overflow-hidden bg-dark text-white md:min-h-[92svh]">
      <motion.div
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0"
      >
        <img
          src={optimizeImageUrl(editorialImages.hero, 1600)}
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
      </motion.div>

      {/* Cinematic overlay: dark on the left where the copy sits, fading toward the photo on the right */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/70 to-dark/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/10 to-transparent" />

      <AeroMapBackground tone="dark" showRouteArc={false} className="z-[1]" />
      <div className="absolute inset-y-0 right-0 z-[1] hidden w-[62%] md:block">
        <FlightRouteMap />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 pb-16 pt-32 md:px-12 md:pb-24">
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
            className="mb-5 text-xs font-medium uppercase tracking-[0.24em] text-sage"
          >
            {t('home.heroEyebrow')}
          </motion.p>
          <h1 className="max-w-2xl font-display text-[2rem] font-medium leading-[1.08] tracking-tight sm:text-6xl md:text-[4rem] lg:text-[4.2rem]">
            {t('home.heroTitle')
              .split('\n')
              .map((line, i) => (
                <span key={i} className="block overflow-hidden pb-1">
                  <motion.span
                    initial={{ y: '110%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.4 + i * 0.08 }}
                    className="block"
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.75 }}
            className="mt-7 max-w-md text-[17px] leading-relaxed text-white/70"
          >
            {t('home.heroSubtitle')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.9 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <NavLink to={localizedPath(locale, '/travel-request')}>
              <Button variant="primary" size="lg">
                {t('home.heroCta')} →
              </Button>
            </NavLink>
            <NavLink to={localizedPath(locale, '/destinations')}>
              <Button variant="secondary" size="lg" className="border-white/25 text-white hover:border-sage hover:text-sage">
                {t('home.heroSecondaryCta')}
              </Button>
            </NavLink>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="absolute bottom-8 right-6 z-10 hidden font-mono text-[11px] uppercase tracking-[0.18em] text-white/40 md:right-12 md:block"
      >
        38.5598° N · 71.0136° E — Dushanbe
      </motion.div>
    </section>
  )
}
