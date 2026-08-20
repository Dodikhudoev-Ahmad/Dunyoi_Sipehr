# Design Bible — AeroTravel

## Direction
Premium international travel/aviation agency. Confident, editorial, quiet-luxury tone — closer to a boutique airline or high-end travel concierge than a generic tour-package template.

## Signature Motif — Aero Map Background
- Faint world-map silhouette (single-tone, low opacity, ~4-6%) as a section background layer, never competing with foreground content.
- Great-circle "route arc" lines (thin, curved, subtle glow) connecting two points — used sparingly on hero and destination sections.
- Fine coordinate/grid ticks along edges of hero sections (like a nav instrument), very low contrast.
- Subtle film-grain/noise overlay (SVG turbulence, ~2-3% opacity) on dark hero sections to avoid flat-gradient "template" look.

## Color System
- Ink (near-black navy): `#0B0F14` — primary dark surface / text on light.
- Paper: `#F7F5F0` — warm off-white surface (not pure white — avoids clinical feel).
- Brand Blue (deep aviation blue): `#123A5C` — primary accent, links, active states.
- Signal Gold: `#C9A24B` — sparing accent for CTAs/highlights only (max 1 per view).
- Slate text: `#3D4552` on light; `#C9D1DB` on dark.
- Success/Warning/Danger: `#1F8A5A` / `#B8862F` / `#B23A32` (muted, not saturated).

## Typography
- Display/serif for headlines (editorial weight) — e.g. a refined serif for H1/H2.
- Grotesk sans for body/UI — high legibility at small sizes.
- Tight tracking on large display type, generous line-height on body copy.
- Scale: 12/14/16/18/22/28/36/48/64 (px base, rem in code).

## Spacing & Layout
- 8px base spacing unit. Section vertical rhythm: 96/128px desktop, 56/72px mobile.
- Max content width 1280px, generous side gutters (24px mobile, 64px+ desktop).
- Cards: consistent aspect ratio per collection (e.g. all Destination cards 4:5), consistent padding token, single shadow style (soft, low-spread).

## Motion
- Restrained: fade+rise (8-12px) on scroll-reveal, 200-350ms ease-out. No bouncy easing. Route-arc draw-on-scroll for hero only.
- Respect `prefers-reduced-motion`.

## Avoid
Emoji, plane clipart, heavy gradients, glassmorphism overuse, mismatched card sizes, default Bootstrap-like shadows/radii, cluttered hero copy.

## Components (design system primitives, built in Stage 8)
Button (primary/secondary/ghost), Badge, Card (Destination/Offer/Testimonial variants share a base), Input/Select/Textarea (RHF-bound), Section wrapper (handles Aero Map bg), Nav, Footer, LocaleSwitcher, Skeleton loaders, EmptyState, ErrorState, Toast.
