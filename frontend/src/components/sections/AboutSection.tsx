import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Languages, Compass, ShieldCheck, Clock, type LucideIcon } from 'lucide-react'
import { useLocale } from '@/i18n/LocaleContext'
import { useSiteContent } from '@/hooks/usePublicData'
import { Section } from '@/components/ui/Section'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { editorialImages } from '@/lib/editorialImages'
import { optimizeImageUrl } from '@/lib/imageOptimize'

const FACT_ICONS: LucideIcon[] = [Languages, Compass, ShieldCheck, Clock]

export function AboutSection() {
  const { t } = useTranslation()
  const locale = useLocale()
  const about = useSiteContent('about-us', locale)
  const facts = t('about.facts', { returnObjects: true }) as string[]

  return (
    <Section className="pt-20 md:pt-28">
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        <motion.div
          initial={{ opacity: 0, scale: 1.03 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="order-2 aspect-[4/5] overflow-hidden rounded-sm md:order-1"
        >
          <img
            src={optimizeImageUrl(editorialImages.about, 1000)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </motion.div>

        <div className="order-1 md:order-2">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-primary">{t('about.eyebrow')}</p>

          {about.isPending && (
            <div className="space-y-3">
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {about.isError && <ErrorState onRetry={() => about.refetch()} />}

          {about.isSuccess && (
            <>
              <h2 className="font-display text-3xl font-medium leading-[1.15] tracking-tight md:text-4xl">
                {about.data.title}
              </h2>
              <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted">{about.data.body}</p>
            </>
          )}

          <dl className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {facts.map((fact, i) => {
              const Icon = FACT_ICONS[i % FACT_ICONS.length] ?? Compass
              return (
                <div key={fact} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-light text-primary">
                    <Icon size={15} strokeWidth={1.75} />
                  </span>
                  <dd className="text-sm leading-snug text-text">{fact}</dd>
                </div>
              )
            })}
          </dl>
        </div>
      </div>
    </Section>
  )
}
