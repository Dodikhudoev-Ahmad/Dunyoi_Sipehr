import { useQuery } from '@tanstack/react-query'
import { NavLink } from 'react-router-dom'
import { MapPinned, Tag, Wrench, Inbox, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react'
import { destinationsApi } from '@/api/destinations'
import { offersApi } from '@/api/offers'
import { servicesApi } from '@/api/services'
import { travelRequestsApi } from '@/api/travelRequests'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageHeader } from '@/admin/components/PageHeader'
import { cn } from '@/lib/cn'

const CONTENT_TILES = [
  { key: 'destinations', label: 'Направления', icon: MapPinned, to: '/admin/destinations' },
  { key: 'offers', label: 'Предложения', icon: Tag, to: '/admin/offers' },
  { key: 'services', label: 'Услуги', icon: Wrench, to: '/admin/services' },
] as const

/** End of "today" in the viewer's local time, as an ISO instant — matches how a human reading
 * "требуют внимания сегодня" would expect the boundary to fall (local midnight, not UTC). */
function endOfTodayIso(): string {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

function MetricTile({ icon: Icon, label, value, to, tone }: { icon: typeof Inbox; label: string; value: number; to: string; tone?: string }) {
  return (
    <NavLink to={to}>
      <Card className="p-6 transition-shadow hover:shadow-md">
        <Icon size={20} className={tone ?? 'text-brand'} />
        <p className="mt-4 text-3xl font-medium">{value}</p>
        <p className="mt-1 text-sm text-slate">{label}</p>
      </Card>
    </NavLink>
  )
}

export function DashboardPage() {
  const { admin } = useAuth()
  const isSuperAdmin = admin?.role === 'SuperAdmin'

  // CRM metrics — every role sees these (Editor's dashboard is CRM-only; SuperAdmin has
  // everything Editor has, plus the content tiles below).
  const crm = useQuery({
    queryKey: ['admin', 'dashboard-crm'],
    queryFn: async () => {
      const [newRequests, dueToday, board] = await Promise.all([
        travelRequestsApi.adminList({ page: 1, pageSize: 1, status: 'New' }),
        travelRequestsApi.adminList({ page: 1, pageSize: 1, dueBy: endOfTodayIso() }),
        travelRequestsApi.adminList({ page: 1, pageSize: 100 }),
      ])
      const won = board.items.filter((r) => r.status === 'Won').length
      const inProgress = board.items.filter((r) => r.status === 'New' || r.status === 'Contacted' || r.status === 'Qualified').length
      return { newCount: newRequests.totalCount, dueToday: dueToday.totalCount, won, inProgress }
    },
  })

  // Content-catalog tiles — SuperAdmin only, matching what they alone can edit.
  const content = useQuery({
    queryKey: ['admin', 'dashboard-content'],
    queryFn: async () => {
      const [destinations, offers, services] = await Promise.all([
        destinationsApi.adminList({ page: 1, pageSize: 1 }),
        offersApi.adminList({ page: 1, pageSize: 1 }),
        servicesApi.adminList({ page: 1, pageSize: 1 }),
      ])
      return { destinations: destinations.totalCount, offers: offers.totalCount, services: services.totalCount }
    },
    enabled: isSuperAdmin,
  })

  return (
    <div>
      <PageHeader title="Дашборд" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {crm.isPending && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        {crm.isError && <ErrorState onRetry={() => crm.refetch()} />}
        {crm.isSuccess && (
          <>
            <MetricTile icon={Inbox} label="Новые заявки" value={crm.data.newCount} to="/admin/travel-requests?status=New" />
            <MetricTile icon={TrendingUp} label="В работе" value={crm.data.inProgress} to="/admin/crm" tone="text-warning" />
            <MetricTile icon={CheckCircle2} label="Успешных сделок" value={crm.data.won} to="/admin/crm" tone="text-success" />
            <MetricTile
              icon={AlertTriangle}
              label="Требуют внимания сегодня"
              value={crm.data.dueToday}
              to="/admin/travel-requests"
              tone={cn(crm.data.dueToday > 0 ? 'text-danger' : 'text-brand')}
            />
          </>
        )}
      </div>

      {isSuperAdmin && (
        <div className="mt-8">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate">Контент сайта</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.isPending && CONTENT_TILES.map((tile) => <Skeleton key={tile.key} className="h-28 w-full" />)}
            {content.isError && <ErrorState onRetry={() => content.refetch()} />}
            {content.isSuccess &&
              CONTENT_TILES.map(({ key, label, icon: Icon, to }) => (
                <MetricTile key={key} icon={Icon} label={label} value={content.data[key]} to={to} />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
