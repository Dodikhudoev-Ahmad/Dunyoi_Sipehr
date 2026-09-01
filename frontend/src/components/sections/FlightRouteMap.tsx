import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'

interface City {
  label: string
  /** Position as a percentage of the overlay's width/height. */
  x: number
  y: number
  delay: number
}

const DUSHANBE: City = { label: 'DUSHANBE', x: 18, y: 88, delay: 0.1 }
const DUBAI: City = { label: 'DUBAI', x: 62, y: 78, delay: 0.2 }
const ISTANBUL: City = { label: 'ISTANBUL', x: 52, y: 30, delay: 0.45 }
const MOSCOW: City = { label: 'MOSCOW', x: 78, y: 22, delay: 0.7 }

const DESTINATIONS = [DUBAI, ISTANBUL, MOSCOW]

/** Quadratic control point offset perpendicular to the leg, biased upward — gives every leg the
 * same gentle "great-circle arc" bow regardless of its orientation, whether it's a short hop or
 * the long diagonal back home. Shared by the static route lines and the plane's flight path so
 * the plane always visually rides the drawn line rather than cutting its own corner. */
function bowControl(from: { x: number; y: number }, to: { x: number; y: number }, bow = 0.32) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  let px = -dy / len
  let py = dx / len
  if (py > 0) {
    px = -px
    py = -py
  }
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  return { x: mx + px * len * bow, y: my + py * len * bow }
}

function legPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const c = bowControl(from, to)
  return `M ${from.x} ${from.y} Q ${c.x} ${c.y} ${to.x} ${to.y}`
}

/** One continuous closed loop — Dushanbe → Dubai → Istanbul → Moscow → Dushanbe — built from the
 * same per-leg arcs as the static lines, so `offset-path` can carry the plane through all four
 * cities in a single, seamless (no end-of-loop jump) repeating animation. */
function loopPath() {
  const stops = [DUSHANBE, ...DESTINATIONS, DUSHANBE]
  let d = `M ${stops[0]!.x} ${stops[0]!.y}`
  for (let i = 1; i < stops.length; i++) {
    const c = bowControl(stops[i - 1]!, stops[i]!)
    d += ` Q ${c.x} ${c.y} ${stops[i]!.x} ${stops[i]!.y}`
  }
  return d
}

/** A premium "glass pill" city label — real HTML/CSS (not SVG text/rect) laid over the map at the
 * same x/y percentages the SVG viewBox uses, so it gets genuine `backdrop-filter: blur()`, a
 * floating drop shadow, and reliable font-weight rendering that SVG `<text>` can't guarantee
 * across browsers. Rendered as a sibling overlay, not inside the SVG — see FlightRouteMap. The
 * origin gets a faint gold edge instead of a bigger typeface, keeping every label the same visual
 * language while still separating "home base" from "destination" by feel, not by size. */
function CityLabel({ label, x, y, delay, origin }: { label: string; x: number; y: number; delay: number; origin?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="absolute -translate-x-1/2 -translate-y-full"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span
        className={cn(
          'mb-2 block rounded-full border px-3 py-1.25 text-[10.5px] font-medium text-white/95 uppercase tracking-[0.22em] backdrop-blur-md shadow-[0_10px_22px_-8px_rgba(4,8,14,0.65)]',
          origin ? 'border-gold/45' : 'border-white/18',
        )}
        style={{ background: 'linear-gradient(180deg, rgba(9,13,20,0.6), rgba(9,13,20,0.32))' }}
      >
        {label}
      </span>
    </motion.div>
  )
}

/** A route node: soft halo + solid core, shared by every city so the network reads as one
 * consistent interface. The origin's halo is a touch larger/brighter — the only size cue that
 * marks it as "home" instead of a destination. A slow, repeating radar-ping ring (respecting
 * prefers-reduced-motion) reads as a live map marker rather than a flat static dot. */
function CityNode({ x, y, delay, origin, reducedMotion }: { x: number; y: number; delay: number; origin?: boolean; reducedMotion: boolean }) {
  return (
    <>
      <circle cx={x} cy={y} r={origin ? 1.7 : 1.15} fill="var(--color-sage)" opacity={origin ? 0.22 : 0.15} />
      {!reducedMotion && (
        <motion.circle
          cx={x}
          cy={y}
          r={origin ? 0.62 : 0.52}
          fill="none"
          stroke="var(--color-sage)"
          strokeWidth={0.16}
          initial={{ opacity: 0.55, scale: 1 }}
          animate={{ opacity: 0, scale: origin ? 2.8 : 2.4 }}
          transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut', delay: delay + (origin ? 0.4 : 1.5) }}
          style={{ transformOrigin: `${x}px ${y}px` }}
        />
      )}
      <motion.circle
        cx={x}
        cy={y}
        r={origin ? 0.62 : 0.52}
        fill="var(--color-sage)"
        stroke="var(--color-dark)"
        strokeWidth={0.12}
        strokeOpacity={0.3}
        initial={reducedMotion ? undefined : { opacity: 0, scale: 0 }}
        animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: delay + (origin ? 0 : 1.1) }}
        style={{ transformOrigin: `${x}px ${y}px` }}
      />
    </>
  )
}

/**
 * A top-down commercial-airliner silhouette (nose to the right, matching `offset-rotate: auto`'s
 * forward direction) — proper Boeing/Airbus-style proportions: a long tapered fuselage with a
 * rounded nose, swept main wings positioned aft-of-center, twin underwing engine pods, and a
 * smaller swept horizontal tailplane near the blunt tail. Built as separate layered shapes (wings
 * and tailplane drawn first, fuselage drawn last on top to cover the wing-root seam) rather than
 * one continuous outline — the standard technique for a clean, legible aircraft icon. A soft drop
 * shadow keeps it visible against both the light-sky and dark-cloud parts of the photo.
 */
function PlaneMark() {
  const stroke = { stroke: 'var(--color-dark)', strokeWidth: 0.09, strokeOpacity: 0.28 }
  return (
    <g filter="url(#planeShadow)" fill="var(--color-white)">
      {/* main wings, swept back, aft-of-center */}
      <path d="M 1.1 0.42 L -0.35 4.55 L -1.5 4.25 L -2.05 0.55 Z" {...stroke} />
      <path d="M 1.1 -0.42 L -0.35 -4.55 L -1.5 -4.25 L -2.05 -0.55 Z" {...stroke} />
      {/* underwing engine pods */}
      <ellipse cx="0.55" cy="2.2" rx="0.62" ry="0.26" {...stroke} />
      <ellipse cx="0.55" cy="-2.2" rx="0.62" ry="0.26" {...stroke} />
      {/* horizontal tailplane */}
      <path d="M -4.3 0.3 L -5.35 1.85 L -5.95 1.68 L -6.1 0.34 Z" {...stroke} />
      <path d="M -4.3 -0.3 L -5.35 -1.85 L -5.95 -1.68 L -6.1 -0.34 Z" {...stroke} />
      {/* fuselage — drawn last so its clean outline sits over the wing/tail roots */}
      <path
        d="M 5.9 0 C 5.75 0.42 5.35 0.62 4.7 0.63 C 3.2 0.65 -1.5 0.58 -4.4 0.4 C -5.3 0.34 -6.05 0.18 -6.35 0 C -6.05 -0.18 -5.3 -0.34 -4.4 -0.4 C -1.5 -0.58 3.2 -0.65 4.7 -0.63 C 5.35 -0.62 5.75 -0.42 5.9 0 Z"
        {...stroke}
      />
    </g>
  )
}

/**
 * Flight-route network for the hero: Dushanbe as the origin/home base, with arcs to every
 * destination we fly. A single plane marker follows one continuous loop — Dushanbe → Dubai →
 * Istanbul → Moscow → Dushanbe — and keeps going indefinitely with no pause or jump at the seam.
 * City labels sit on a soft glass-pill badge for legibility against both the light-sky and
 * dark-cloud parts of the photo. Purely decorative — aria-hidden. Respects prefers-reduced-motion:
 * the plane sits still near Dushanbe, oriented toward the first leg, instead of animating.
 */
export function FlightRouteMap({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion()
  const staticHeading = (Math.atan2(DUBAI.y - DUSHANBE.y, DUBAI.x - DUSHANBE.x) * 180) / Math.PI

  return (
    <div className={cn('relative h-full w-full', className)}>
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <filter id="planeShadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0.12" stdDeviation="0.22" floodColor="var(--color-dark)" floodOpacity="0.55" />
          </filter>
        </defs>

        {DESTINATIONS.map((city) => (
          <motion.path
            key={city.label}
            d={legPath(DUSHANBE, city)}
            fill="none"
            stroke="var(--color-sage)"
            strokeWidth={0.22}
            strokeDasharray="0.7 1.1"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity={0.7}
            initial={reducedMotion ? undefined : { pathLength: 0 }}
            animate={reducedMotion ? undefined : { pathLength: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: city.delay }}
          />
        ))}

        <CityNode x={DUSHANBE.x} y={DUSHANBE.y} delay={0.1} origin reducedMotion={!!reducedMotion} />

        {DESTINATIONS.map((city) => (
          <CityNode key={city.label} x={city.x} y={city.y} delay={city.delay} reducedMotion={!!reducedMotion} />
        ))}

        {reducedMotion ? (
          <g transform={`translate(${DUSHANBE.x} ${DUSHANBE.y}) rotate(${staticHeading})`}>
            <PlaneMark />
          </g>
        ) : (
          <motion.g
            initial={{ offsetDistance: '0%' }}
            animate={{ offsetDistance: '100%' }}
            transition={{ duration: 17, ease: 'easeInOut', repeat: Infinity }}
            style={{ offsetPath: `path("${loopPath()}")`, offsetRotate: 'auto' }}
          >
            <PlaneMark />
          </motion.g>
        )}
      </svg>

      {/* City labels as a real HTML overlay (not SVG text/rect) — see CityLabel for why: genuine
          backdrop-blur and reliable font-weight rendering. Positioned at the same x/y percentages
          as the SVG viewBox (0-100 with preserveAspectRatio="none" maps 1:1 onto this box). */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <CityLabel label={DUSHANBE.label} x={DUSHANBE.x} y={DUSHANBE.y} delay={0.1} origin />
        {DESTINATIONS.map((city) => (
          <CityLabel key={city.label} label={city.label} x={city.x} y={city.y} delay={city.delay + 1.15} />
        ))}
      </div>
    </div>
  )
}
