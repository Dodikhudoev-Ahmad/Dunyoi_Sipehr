import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SectionHeadingProps {
  eyebrow: string
  title: ReactNode
  subtitle?: ReactNode
  linkTo?: string
  linkLabel?: string
  className?: string
}

/**
 * Single shared layout for every section header (eyebrow + title + optional
 * "view all" link on the right) so spacing, baseline and typography stay
 * identical across Destinations / Offers / Services / About — do not
 * hand-roll this markup per section.
 */
export function SectionHeading({ eyebrow, title, subtitle, linkTo, linkLabel, className }: SectionHeadingProps) {
  return (
    <div className={cn('mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16', className)}>
      <div className="max-w-xl">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h2 className="font-display text-3xl font-medium tracking-tight md:text-5xl">{title}</h2>
        {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
      </div>
      {linkTo && linkLabel && (
        <NavLink to={linkTo} className="group hidden items-center gap-1.5 text-sm font-medium text-text md:flex">
          {linkLabel}
          <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
        </NavLink>
      )}
    </div>
  )
}
