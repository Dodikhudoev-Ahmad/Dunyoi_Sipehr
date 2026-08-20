import { Outlet } from 'react-router-dom'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { LocaleProvider } from '@/i18n/LocaleContext'
import type { Locale } from '@/types/domain'

export function PublicLayout({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider locale={locale}>
      <div className="flex min-h-screen flex-col">
        <Nav />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </LocaleProvider>
  )
}
