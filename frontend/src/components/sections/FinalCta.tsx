import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useLocale, localizedPath } from '@/i18n/LocaleContext'
import { Button } from '@/components/ui/Button'
import { editorialImages } from '@/lib/editorialImages'

export function FinalCta() {
  const { t } = useTranslation()
  const locale = useLocale()

  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-dark text-white md:min-h-[80vh]">
      <motion.img
        initial={{ scale: 1.1 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        src={editorialImages.finalCta}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-dark/80 via-dark/55 to-dark/85" />

      <div className="relative mx-auto max-w-[900px] px-6 py-24 text-center md:px-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="font-display text-4xl font-medium uppercase leading-[1.08] tracking-tight sm:text-5xl md:text-6xl"
        >
          {t('home.finalCtaTitle')
            .split('\n')
            .map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="mx-auto mt-6 max-w-md text-[17px] text-white/70"
        >
          {t('home.finalCtaSubtitle')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          className="mt-10"
        >
          <NavLink to={localizedPath(locale, '/travel-request')}>
            <Button variant="primary" size="lg">
              {t('home.finalCtaButton')} →
            </Button>
          </NavLink>
        </motion.div>
      </div>
    </section>
  )
}
