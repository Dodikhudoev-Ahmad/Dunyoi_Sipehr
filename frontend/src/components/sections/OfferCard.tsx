import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, ImageOff } from 'lucide-react'
import { useLocale, localizedPath } from '@/i18n/LocaleContext'
import type { Offer } from '@/types/domain'
import { cn } from '@/lib/cn'
import { currencySymbol } from '@/lib/currency'
import { optimizeImageUrl } from '@/lib/imageOptimize'

export function OfferCard({ offer, index = 0, className }: { offer: Offer; index?: number; className?: string }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const currency = currencySymbol(t, offer.currency)
  const cover = offer.heroImageUrl ?? offer.galleryUrls?.[0]
  const eyebrow = offer.durationDays ? t('offers.duration', { count: offer.durationDays }) : t('offers.eyebrowFallback')
  const [loaded, setLoaded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: Math.min(index, 4) * 0.06 }}
      className={cn('group h-full', className)}
    >
      <NavLink to={localizedPath(locale, `/offers/${offer.slug}`)} className="flex h-full flex-col">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-dark/5 ring-1 ring-inset ring-dark/[0.06]">
          {cover ? (
            <img
              src={optimizeImageUrl(cover, 800)}
              alt={offer.title}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
              className={cn(
                'h-full w-full object-cover transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.04]',
                loaded ? 'opacity-100' : 'opacity-0',
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-subtle text-brand/40">
              <ImageOff size={28} strokeWidth={1.5} aria-hidden />
            </div>
          )}
          {offer.isFeatured && (
            <span className="absolute left-5 top-5 text-[11px] font-medium uppercase tracking-[0.16em] text-white drop-shadow">
              {t('destinations.featuredTag')}
            </span>
          )}
        </div>

        <div className="mt-5 flex flex-1 flex-col">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <h3 className="mt-2 line-clamp-1 font-display text-xl font-medium md:text-2xl">{offer.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted">{offer.summary}</p>

          <div className="mt-auto flex items-center justify-between border-t border-text/10 pt-4">
            <span className="text-[15px] font-medium text-text">
              {t('offers.priceFrom')} {currency}{offer.priceFrom.toLocaleString(locale)}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-text/15 text-text transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-primary group-hover:text-primary">
              <ArrowUpRight size={14} />
            </span>
          </div>
        </div>
      </NavLink>
    </motion.div>
  )
}
