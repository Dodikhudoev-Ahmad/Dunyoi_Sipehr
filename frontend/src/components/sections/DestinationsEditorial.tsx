import { useTranslation } from 'react-i18next'
import { useLocale, localizedPath } from '@/i18n/LocaleContext'
import { useDestinations } from '@/hooks/usePublicData'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { SkeletonCardGrid } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { DestinationCard } from '@/components/sections/DestinationCard'
import type { Destination } from '@/types/domain'

/** How many featured destinations the homepage section can show. Not an editorial cap on
 * purpose — every published featured destination should appear here. */
const MAX_COUNT = 6

export function DestinationsEditorial() {
  const { t } = useTranslation()
  const locale = useLocale()

  const featured = useDestinations(locale, { featured: true, pageSize: MAX_COUNT })
  const needsMore = featured.isSuccess && featured.data.items.length < MAX_COUNT
  // Real API data only: if fewer than MAX_COUNT are marked featured, top up with the next
  // published destinations so the editorial grid still reads full — never invented content.
  const more = useDestinations(locale, { pageSize: MAX_COUNT }, { enabled: needsMore })

  const items = featured.isSuccess
    ? [...featured.data.items, ...(more.data?.items ?? [])]
        .filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i)
        .slice(0, MAX_COUNT)
    : []

  const isPending = featured.isPending || (needsMore && more.isPending)

  return (
    <Section id="destinations" className="pt-16 pb-16 md:pt-20 md:pb-20 lg:pt-24 lg:pb-24">
      <SectionHeading
        eyebrow={t('destinations.eyebrow')}
        title={t('home.featuredDestinations')}
        linkTo={localizedPath(locale, '/destinations')}
        linkLabel={t('destinations.backToList')}
      />

      {isPending && <SkeletonCardGrid />}
      {featured.isError && <ErrorState onRetry={() => featured.refetch()} />}
      {featured.isSuccess && items.length === 0 && <EmptyState title={t('destinations.empty')} />}
      {featured.isSuccess && items.length > 0 && <EditorialGrid items={items} />}
    </Section>
  )
}

/**
 * Explicit single-level CSS Grid — no nested grid, no implicit row-span sizing.
 * `md:grid-rows-2` declares the row track heights up front so the large tile's
 * `row-span-2` height is never ambiguous. 1/2/3-item cases each get their own
 * deliberate, non-overlapping layout.
 */
function EditorialGrid({ items }: { items: Destination[] }) {
  const [first, second, third] = items

  if (!first) return null

  if (items.length === 1) {
    return <DestinationCard destination={first} size="large" className="mx-auto max-w-3xl" />
  }

  if (items.length === 2) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
        <DestinationCard destination={first} index={0} size="large" />
        {second && <DestinationCard destination={second} index={1} size="large" />}
      </div>
    )
  }

  if (items.length === 3) {
    return (
      // Below lg: a plain, uniform 2-column grid (no asymmetry, no capped height — cards just use
      // their natural aspect-ratio). At lg+: the editorial hero composition, but height-capped via
      // `lg:h-[720px]` + `lg:grid-rows-2` (~650–760px target on a 1440 canvas) instead of letting
      // aspect-ratio stack two tall tiles into an almost-full-screen block.
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-rows-2 lg:gap-6 lg:h-[720px]">
        <DestinationCard destination={first} size="large" fill className="lg:row-span-2" />
        {second && <DestinationCard destination={second} index={1} size="default" fill />}
        {third && <DestinationCard destination={third} index={2} size="default" fill />}
      </div>
    )
  }

  // 4+ items: the asymmetric hero composition is only designed for exactly 3 tiles, so beyond
  // that it switches to a plain uniform grid (3 columns x N rows on desktop) — every featured,
  // published destination gets shown rather than being capped to fit a fixed layout.
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
      {items.map((item, i) => (
        <DestinationCard key={item.id} destination={item} index={i} size="default" />
      ))}
    </div>
  )
}
