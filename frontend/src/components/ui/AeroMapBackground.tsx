import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'

interface AeroMapBackgroundProps {
  /** 'dark'/'light' are fixed-color variants for permanently-dark or permanently-light surfaces
   * (Hero, dark editorial sections). 'adaptive' is the page-header treatment: line color, opacity
   * and the gradient wash all read from CSS custom properties that flip under `:root.dark` (see
   * index.css), so the exact same markup looks right whether the site is in light or dark theme —
   * blue-on-cream in light, gold-on-charcoal with a soft glow in dark. */
  tone?: 'dark' | 'light' | 'adaptive'
  showRouteArc?: boolean
  /** Animates the route arc drawing in once on mount — reserved for the hero, respects reduced-motion. */
  animateRoute?: boolean
  className?: string
}

/**
 * Signature "Aero Map Background" motif (see docs/DESIGN_BIBLE.md):
 * a faint world-map silhouette, a great-circle route arc, coordinate/grid
 * ticks along the edges, a subtle film-grain overlay, and — for the 'adaptive'
 * page-header variant — a soft gold/blue gradient wash so a flat page-header
 * doesn't read as an empty block of color. Pure decoration: aria-hidden,
 * absolutely positioned behind content. Always secondary to real photography —
 * kept intentionally faint.
 */
export function AeroMapBackground({ tone = 'light', showRouteArc = true, animateRoute = false, className }: AeroMapBackgroundProps) {
  const reducedMotion = useReducedMotion()
  const adaptive = tone === 'adaptive'
  const lineColor = adaptive ? 'var(--color-map-line)' : tone === 'dark' ? 'var(--color-sage)' : 'var(--color-primary)'
  const mapOpacity = adaptive ? 'var(--map-bg-opacity)' : tone === 'dark' ? 0.05 : 0.04
  const routeOpacity = adaptive ? 'var(--map-route-opacity)' : tone === 'dark' ? 0.4 : 0.28
  const tickOpacity = adaptive ? 'var(--map-tick-opacity)' : tone === 'dark' ? 0.18 : 0.13
  const grainOpacity = adaptive ? 'var(--map-grain-opacity)' : 0.03

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {adaptive && <div className="absolute inset-0" style={{ background: 'var(--map-wash)' }} />}

      {/* World map silhouette (simplified continents as dot/line clusters) */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice">
        <g style={{ opacity: mapOpacity }} stroke={lineColor} strokeWidth="1" fill="none">
          <path d="M120 180 Q 260 120 380 170 T 620 200 T 860 160" />
          <path d="M180 260 Q 340 230 480 280 T 760 300 T 1040 260" />
          <path d="M260 380 Q 420 340 600 390 T 900 400 T 1180 360" />
          <path d="M340 500 Q 500 470 680 510 T 980 520 T 1260 480" />
          {Array.from({ length: 90 }).map((_, i) => {
            const x = (i * 173) % 1440
            const y = 60 + ((i * 97) % 620)
            return <circle key={i} cx={x} cy={y} r="1.4" fill={lineColor} stroke="none" />
          })}
        </g>

        {showRouteArc && (
          <g style={{ opacity: routeOpacity }}>
            <motion.path
              d="M 240 460 Q 720 120 1200 380"
              stroke={lineColor}
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="4 6"
              initial={animateRoute && !reducedMotion ? { pathLength: 0 } : undefined}
              animate={animateRoute && !reducedMotion ? { pathLength: 1 } : undefined}
              transition={{ duration: 1.6, ease: 'easeOut', delay: 0.3 }}
            />
            <circle cx="240" cy="460" r="4" fill={lineColor} />
            <circle cx="1200" cy="380" r="4" fill={lineColor} />
          </g>
        )}

        {/* Coordinate / grid ticks along the edges */}
        <g style={{ opacity: tickOpacity }} stroke={lineColor} strokeWidth="1">
          {Array.from({ length: 24 }).map((_, i) => (
            <line key={`top-${i}`} x1={i * 60} y1={0} x2={i * 60} y2={i % 4 === 0 ? 14 : 8} />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`side-${i}`} x1={0} y1={i * 60} x2={i % 4 === 0 ? 14 : 8} y2={i * 60} />
          ))}
        </g>
      </svg>

      {(tone === 'dark' || adaptive) && (
        <svg className="absolute inset-0 h-full w-full mix-blend-overlay" style={{ opacity: grainOpacity }}>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      )}
    </div>
  )
}
