/**
 * Curated, royalty-free editorial photography used for static brand/design
 * moments (hero, brand-statement band, testimonials backdrop, final CTA)
 * that are not backed by API data. Centralized here per design-system
 * convention: never inline a photo URL directly in a component.
 *
 * AeroTravel is an airline-ticketing service, not a tour operator — imagery
 * leans on aviation (aircraft, airports, flight) rather than generic tourism.
 * Real catalog imagery (destinations, offers) always comes from the API —
 * see docs/BLOCKERS.md BLK-007 for the dev-seed placeholder policy.
 */
function unsplash(id: string, w: number, q = 80) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=${q}&fm=jpg&fit=crop`
}

export const editorialImages = {
  /** Airplane wing over clouds at golden hour — hero cinematic backdrop, immediate "flight" cue. */
  hero: unsplash('1436491865332-7a61a109cc05', 2000),
  /** Aircraft on the tarmac facing a terminal, symmetrical — "precision routing" brand statement. */
  brandStatement: unsplash('1569154941061-e231b4725ef1', 1600),
  /** City lights viewed from above at night — dark, immersive testimonials backdrop. */
  testimonialsBackdrop: unsplash('1444723121867-7a241cacace9', 1800),
  /** Aircraft taking off in silhouette at dusk with runway lights — full-bleed final CTA. */
  finalCta: unsplash('1520437358207-323b43b50729', 2000),
  /** Airport departure board with a traveler — About/brand-story image (route & fare selection). */
  about: unsplash('1517400508447-f8dd518b86db', 1400),

  /* ---- Internal page-header photography (PageHero) — see docs/PROGRESS.md for the curation
     pass: every id below was downloaded and visually verified before use, not guessed. ---- */
  /** Airplane cabin interior, passengers seated — Services page header. */
  servicesHeader: unsplash('1540339832862-474599807836', 1920),
  /** Aircraft landing against a blue sky with clouds — FAQ page header. */
  faqHeader: unsplash('1569629743817-70d8db6c323b', 1920),
  /** Private jet on the tarmac at golden hour — Offers/fares page header. */
  offersHeader: unsplash('1474302770737-173ee21bab63', 1920),
  /** Private jet with boarding stairs under a bright blue sky — Travel Request page header. */
  travelRequestHeader: unsplash('1540962351504-03099e0a754b', 1920),
  /** Airplane wing silhouette through the window at dusk — Contacts page header. */
  contactsHeader: unsplash('1507812984078-917a274065be', 1920),
  /** Dubai skyline at sunset — Destinations page header (matches the seeded Dubai destination photo). */
  destinationsHeader: unsplash('1512453979798-5ea266f8880c', 1920),
} as const
