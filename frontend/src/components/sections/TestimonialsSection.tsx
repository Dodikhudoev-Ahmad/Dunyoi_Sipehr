import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Star, ArrowLeft, ArrowRight } from 'lucide-react'
import { useLocale } from '@/i18n/LocaleContext'
import { useTestimonials } from '@/hooks/usePublicData'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { editorialImages } from '@/lib/editorialImages'
import { cn } from '@/lib/cn'

const AUTOPLAY_INTERVAL_MS = 3000

export function TestimonialsSection() {
  const { t } = useTranslation()
  const locale = useLocale()
  const testimonials = useTestimonials(locale)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const reducedMotion = useReducedMotion()

  const items = testimonials.data ?? []
  const current = items[active]

  // Autoplay: cycles every AUTOPLAY_INTERVAL_MS, disabled entirely under prefers-reduced-motion,
  // paused on hover, and restarted (via resetSignal) whenever the user manually navigates so a
  // click doesn't get immediately undone by the timer.
  useEffect(() => {
    if (reducedMotion || paused || items.length <= 1) return
    const id = window.setInterval(() => {
      setActive((a) => (a + 1) % items.length)
    }, AUTOPLAY_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [reducedMotion, paused, items.length, resetSignal])

  function goTo(index: number) {
    setActive(index)
    setResetSignal((s) => s + 1)
  }

  return (
    <section className="relative overflow-hidden bg-dark py-20 text-white md:py-28">
      <img src={editorialImages.testimonialsBackdrop} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/85 to-dark/70" />

      <div className="relative mx-auto max-w-[1440px] px-6 md:px-12">
        <h2 className="mb-14 font-display text-3xl font-medium tracking-tight md:mb-20 md:text-5xl">{t('home.testimonials')}</h2>

        {testimonials.isPending && (
          <div className="mx-auto max-w-2xl space-y-4">
            <Skeleton className="h-8 w-full bg-white/10" />
            <Skeleton className="h-8 w-3/4 bg-white/10" />
          </div>
        )}
        {testimonials.isError && <ErrorState onRetry={() => testimonials.refetch()} />}
        {testimonials.isSuccess && items.length === 0 && <EmptyState title={t('testimonialsPage.empty')} />}

        {testimonials.isSuccess && items.length > 0 && current && (
          <div
            className="mx-auto max-w-3xl"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              >
                <div className="flex items-center gap-1 text-sage">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} fill={i < current.rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
                  ))}
                </div>
                <p className="mt-6 font-display text-2xl font-medium leading-[1.35] tracking-tight md:text-4xl">
                  &ldquo;{current.quote}&rdquo;
                </p>
                <div className="mt-8 flex items-center gap-3">
                  {current.avatarUrl ? (
                    <img src={current.avatarUrl} alt={current.authorName} className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-sm font-medium">
                      {current.authorName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{current.authorName}</p>
                    <p className="text-xs text-white/50">{current.authorCountry}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {items.length > 1 && (
              <div className="mt-12 flex items-center gap-6">
                <button
                  aria-label={t('testimonialsPage.prev')}
                  onClick={() => goTo((active - 1 + items.length) % items.length)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-sage hover:text-sage"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="flex items-center gap-2">
                  {items.map((item, i) => (
                    <button
                      key={item.id}
                      aria-label={`${i + 1}`}
                      aria-current={i === active ? 'true' : undefined}
                      onClick={() => goTo(i)}
                      className={cn('h-1.5 rounded-full transition-all duration-300', i === active ? 'w-6 bg-sage' : 'w-1.5 bg-white/25')}
                    />
                  ))}
                </div>
                <button
                  aria-label={t('testimonialsPage.next')}
                  onClick={() => goTo((active + 1) % items.length)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-sage hover:text-sage"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
