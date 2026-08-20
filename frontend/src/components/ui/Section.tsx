import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { AeroMapBackground } from '@/components/ui/AeroMapBackground'

interface SectionProps {
  children: ReactNode
  className?: string
  id?: string
  tone?: 'paper' | 'ink'
  withMap?: boolean
  showRouteArc?: boolean
}

/** Standard section rhythm (96/128px desktop, 56/72px mobile per DESIGN_BIBLE) with optional Aero Map background. */
export function Section({ children, className, id, tone = 'paper', withMap = false, showRouteArc }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'relative py-14 md:py-24 lg:py-32',
        tone === 'ink' ? 'bg-ink text-white' : 'bg-paper text-text',
        className,
      )}
    >
      {withMap && <AeroMapBackground tone={tone === 'ink' ? 'dark' : 'adaptive'} showRouteArc={showRouteArc} />}
      {/* Container width/padding must match Nav/Footer/Hero exactly (max-w-[1440px], px-6 lg:px-12) —
          this is the site-wide horizontal alignment system; do not diverge per-section. */}
      <div className="relative mx-auto max-w-[1440px] px-6 lg:px-12">{children}</div>
    </section>
  )
}
