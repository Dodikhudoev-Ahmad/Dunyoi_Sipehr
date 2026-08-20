import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocale, localizedPath } from '@/i18n/LocaleContext'
import type { Destination } from '@/types/domain'
import { cn } from '@/lib/cn'

interface DestinationCardProps {
  destination: Destination
  index?: number
  /** 'large' spans the editorial hero slot in the home grid; 'default' is the standard grid tile. */
  size?: 'large' | 'default'
  /** When true, the image container fills its grid cell at lg+ via CSS Grid stretch instead of
   * being sized by aspect-ratio. Used by the capped-height 3-tile hero composition so the whole
   * grid has an explicit, bounded height instead of growing however tall aspect ratios dictate.
   * Below lg, tiles still fall back to a uniform aspect-ratio card (tablet/mobile never use `fill`). */
  fill?: boolean
  className?: string
}

export function DestinationCard({ destination, index = 0, size = 'default', fill = false, className }: DestinationCardProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const large = size === 'large'

  const aspectClass = fill
    ? 'aspect-[4/5] lg:aspect-auto'
    : large
      ? 'aspect-[4/5] md:aspect-[16/12]'
      : 'aspect-[4/5]'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: Math.min(index, 4) * 0.06 }}
      className={cn('group h-full', className)}
    >
      <NavLink to={localizedPath(locale, `/destinations/${destination.slug}`)} className="block h-full">
        <div
          className={cn(
            // `w-full` is required alongside `h-full`: once a tile gets a definite height from
            // CSS Grid stretch (the `fill` case), `aspect-ratio` would otherwise compute width
            // *from* that height (ballooning far past the grid column) instead of respecting it.
            'relative flex h-full w-full overflow-hidden rounded-sm ring-1 ring-inset ring-dark/[0.06]',
            aspectClass,
          )}
        >
          <img
            src={destination.heroImageUrl}
            alt={destination.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark/85 via-dark/10 to-transparent" />

          {destination.isFeatured && (
            <span className="absolute left-5 top-5 text-[11px] font-medium uppercase tracking-[0.16em] text-sage">
              {t('destinations.featuredTag')}
            </span>
          )}

          <div className="relative mt-auto flex w-full items-end justify-between gap-4 p-5 md:p-7">
            <div className="min-w-0">
              <h3
                className={cn(
                  'font-display font-medium text-white',
                  large ? 'text-xl md:text-2xl lg:text-4xl' : 'text-xl md:text-2xl',
                )}
              >
                {destination.title}
              </h3>
              <p className={cn('mt-2 line-clamp-2 text-white/70', large ? 'max-w-md text-sm lg:text-[15px]' : 'text-sm')}>
                {destination.summary}
              </p>
            </div>
            <span className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-sage group-hover:text-sage">
              <ArrowUpRight size={16} />
            </span>
          </div>
        </div>
      </NavLink>
    </motion.div>
  )
}
