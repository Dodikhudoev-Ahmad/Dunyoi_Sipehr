import { useQuery } from '@tanstack/react-query'
import { NavLink } from 'react-router-dom'
import { MapPinned, Tag, Wrench, Inbox } from 'lucide-react'
import { destinationsApi } from '@/api/destinations'
import { offersApi } from '@/api/offers'
import { servicesApi } from '@/api/services'
import { travelRequestsApi } from '@/api/travelRequests'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageHeader } from '@/admin/components/PageHeader'

const TILES = [
  { key: 'destinations', label: 'Направления', icon: MapPinned, to: '/admin/destinations' },
  { key: 'offers', label: 'Предложения', icon: Tag, to: '/admin/offers' },
  { key: 'services', label: 'Услуги', icon: Wrench, to: '/admin/services' },
  { key: 'travelRequests', label: 'Новые заявки', icon: Inbox, to: '/admin/travel-requests' },
] as const

export function DashboardPage() {
  const summary = useQuery({
    queryKey: ['admin', 'dashboard-summary'],
    queryFn: async () => {
      const [destinations, offers, services, newRequests] = await Promise.all([
        destinationsApi.adminList({ page: 1, pageSize: 1 }),
        offersApi.adminList({ page: 1, pageSize: 1 }),
        servicesApi.adminList({ page: 1, pageSize: 1 }),
        travelRequestsApi.adminList({ page: 1, pageSize: 1, status: 'New' }),
      ])
      return {
        destinations: destinations.totalCount,
        offers: offers.totalCount,
        services: services.totalCount,
        travelRequests: newRequests.totalCount,
      }
    },
  })

  return (
    <div>
      <PageHeader title="Дашборд" />

      {summary.isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TILES.map((tile) => (
            <Skeleton key={tile.key} className="h-28 w-full" />
          ))}
        </div>
      )}

      {summary.isError && <ErrorState onRetry={() => summary.refetch()} />}

      {summary.isSuccess && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TILES.map(({ key, label, icon: Icon, to }) => (
            <NavLink key={key} to={to}>
              <Card className="p-6 transition-shadow hover:shadow-md">
                <Icon size={20} className="text-brand" />
                <p className="mt-4 text-3xl font-medium">{summary.data[key]}</p>
                <p className="mt-1 text-sm text-slate">{label}</p>
              </Card>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}
