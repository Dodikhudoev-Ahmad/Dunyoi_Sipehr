import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, MapPin } from 'lucide-react'
import { useLocale } from '@/i18n/LocaleContext'
import { useSiteContent } from '@/hooks/usePublicData'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { Seo } from '@/components/seo/Seo'
import { pageTitle, ogImageUrl, SITE_CONTACT } from '@/lib/seo'
import { editorialImages } from '@/lib/editorialImages'

export function ContactsPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const content = useSiteContent('contacts', locale)

  return (
    <>
      <Seo title={pageTitle(t('contacts.title'))} path="/contacts" image={ogImageUrl(editorialImages.contactsHeader)} />
      <PageHero image={editorialImages.contactsHeader} eyebrow={t('nav.contacts')} title={t('contacts.title')} />
      <Section>
        {content.isPending && <Skeleton className="h-[420px] w-full max-w-[1100px]" />}
        {content.isError && <ErrorState onRetry={() => content.refetch()} />}
        {content.isSuccess && (
          <div className="relative mx-auto w-full max-w-[1100px] overflow-hidden rounded-[28px] border border-text/10 bg-elevated/70 px-6 py-10 shadow-[0_1px_2px_rgba(11,15,20,0.06),0_24px_64px_-16px_rgba(11,15,20,0.28)] backdrop-blur-xl sm:px-10 md:px-14 md:py-16">
            {/* Soft inner highlight along the top edge — glass-panel feel, not a gradient wash. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
            />

            {/* Faint navigation motif — a single flight-route line and a coordinate marker,
                deliberately quiet so it never competes with the contact information. */}
            <svg
              aria-hidden
              viewBox="0 0 1100 420"
              preserveAspectRatio="xMidYMid slice"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]"
            >
              <path
                d="M -40 340 Q 260 120 560 210 T 1140 90"
                stroke="var(--color-gold)"
                strokeWidth="1"
                strokeDasharray="2 7"
                fill="none"
              />
              <circle cx="-40" cy="340" r="2.5" fill="var(--color-gold)" />
              <circle cx="1140" cy="90" r="2.5" fill="var(--color-gold)" />
            </svg>
            <p
              aria-hidden
              className="pointer-events-none absolute bottom-6 right-7 font-sans text-[10px] uppercase tracking-[0.3em] text-slate/40"
            >
              Dushanbe · 38.5598° N
            </p>

            <div className="relative grid gap-10 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-16">
              {/* Left — editorial intro */}
              <div className="flex flex-col justify-center">
                <p className="text-xs font-medium uppercase tracking-[0.32em] text-sage">{t('contacts.eyebrow')}</p>
                <h2 className="mt-4 font-display text-3xl font-medium leading-[1.1] tracking-tight text-text md:text-[2.6rem]">
                  {t('contacts.heading')}
                </h2>
                <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-slate">{t('contacts.supportingText')}</p>
              </div>

              {/* Right — structured contact panel */}
              <div className="divide-y divide-text/10 border-t border-text/10 md:border-t-0 md:border-l md:pl-14">
                <ContactItem
                  index="01"
                  icon={<MapPin size={17} strokeWidth={1.6} />}
                  label={t('contacts.address')}
                >
                  <p className="text-[15px] leading-relaxed text-text">{content.data.body || '—'}</p>
                </ContactItem>

                <ContactItem
                  index="02"
                  icon={<Phone size={17} strokeWidth={1.6} />}
                  label={t('contacts.phone')}
                >
                  <a
                    href={`tel:${SITE_CONTACT.phone}`}
                    className="group/link inline-flex items-baseline gap-2 text-[17px] font-medium text-text transition-all duration-300 hover:translate-x-0.5 hover:text-brand"
                  >
                    {SITE_CONTACT.phoneDisplay}
                    <span className="text-brand opacity-0 transition-opacity duration-300 group-hover/link:opacity-100">→</span>
                  </a>
                </ContactItem>

                <ContactItem
                  index="03"
                  icon={<Mail size={17} strokeWidth={1.6} />}
                  label={t('contacts.email')}
                >
                  <a
                    href={`mailto:${SITE_CONTACT.email}`}
                    className="group/link inline-flex items-baseline gap-2 text-[17px] font-medium text-text transition-all duration-300 hover:translate-x-0.5 hover:text-brand"
                  >
                    {SITE_CONTACT.email}
                    <span className="text-brand opacity-0 transition-opacity duration-300 group-hover/link:opacity-100">→</span>
                  </a>
                </ContactItem>
              </div>
            </div>
          </div>
        )}
      </Section>
    </>
  )
}

interface ContactItemProps {
  index: string
  icon: ReactNode
  label: string
  children: ReactNode
}

/** One editorial contact block: index number, icon, uppercase micro-label, primary content. */
function ContactItem({ index, icon, label, children }: ContactItemProps) {
  return (
    <div className="group flex items-start gap-5 py-6 first:pt-0 last:pb-0 md:py-7">
      <span className="mt-0.5 shrink-0 font-display text-sm text-slate/40">{index}</span>
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-text/10 text-brand transition-colors duration-300 group-hover:border-brand/30">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate/70">{label}</p>
        <div className="mt-1.5">{children}</div>
      </div>
    </div>
  )
}
