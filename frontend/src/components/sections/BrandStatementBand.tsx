import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { editorialImages } from '@/lib/editorialImages'

export function BrandStatementBand() {
  const { t } = useTranslation()

  return (
    <section className="relative flex min-h-[56vh] items-center overflow-hidden bg-dark text-white md:min-h-[64vh]">
      <img
        src={editorialImages.brandStatement}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-dark/55" />

      <div className="relative mx-auto max-w-[1000px] px-6 py-20 text-center md:px-12">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-6 text-xs font-medium uppercase tracking-[0.22em] text-sage"
        >
          {t('home.brandStatementEyebrow')}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="font-display text-3xl font-medium leading-[1.2] tracking-tight sm:text-4xl md:text-5xl"
        >
          {t('home.brandStatement')
            .split('\n')
            .map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
        </motion.p>
      </div>
    </section>
  )
}
