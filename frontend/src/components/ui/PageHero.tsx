import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

interface PageHeroProps {
  /** Background photo URL — a real photograph, not the vector Aero Map motif. */
  image: string
  /** Short uppercase label above the title (e.g. "УСЛУГИ"). Reuses the same nav.* copy as the header link. */
  eyebrow?: string
  /** "← Back to list" style link, rendered above the eyebrow — used by the detail pages. */
  backTo?: string
  backLabel?: string
  title: ReactNode
  subtitle?: ReactNode
  /** Extra content under the subtitle (e.g. the price/duration row on OfferDetailPage). */
  children?: ReactNode
  className?: string
}

/**
 * Photographic page-header band for internal pages: a real photo, a dark gradient for text
 * contrast, and the same serif-headline language as the homepage `HeroSection` — scaled down to
 * ~340-420px instead of full-bleed. Replaces the old flat `AeroMapBackground` page-header
 * treatment (still used by `HeroSection` itself and dark editorial panels via `Section`).
 */
export function PageHero({ image, eyebrow, backTo, backLabel, title, subtitle, children, className }: PageHeroProps) {
  return (
    <section className={cn('relative flex min-h-[340px] items-end overflow-hidden bg-dark text-white md:min-h-[420px]', className)}>
      <motion.div
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0"
      >
        <img src={image} alt="" className="h-full w-full object-cover" loading="eager" fetchPriority="high" />
      </motion.div>

      {/* Dark scrim for text contrast — a touch deeper in dark theme so the band still reads as
          premium rather than washed out next to the surrounding dark surface. */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/55 to-dark/15 dark:via-dark/70 dark:to-dark/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-dark/55 via-transparent to-transparent" />

      {/* Soft gold glow echoing the logo — subtle, decorative only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full opacity-25 blur-3xl"
        style={{ background: 'var(--color-gold)' }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-10 md:px-12 md:py-14">
        {backTo && backLabel && (
          <NavLink to={backTo} className="mb-4 inline-flex items-center gap-1 text-sm text-white/70 transition-colors hover:text-white">
            ← {backLabel}
          </NavLink>
        )}
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-sage"
          >
            {eyebrow}
          </motion.p>
        )}
        <h1 className="max-w-2xl font-display text-3xl font-medium leading-[1.1] tracking-tight md:text-5xl lg:text-[3.4rem]">{title}</h1>
        {subtitle && <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/75 md:text-lg">{subtitle}</p>}
        {children}
      </div>
    </section>
  )
}
