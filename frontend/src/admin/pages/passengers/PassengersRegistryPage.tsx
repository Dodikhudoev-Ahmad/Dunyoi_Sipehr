import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { flightsApi, passengersApi } from '@/api/flights'
import type { PassengerRegistryItem } from '@/types/domain'
import { PageHeader } from '@/admin/components/PageHeader'
import { DataTable, type Column } from '@/admin/components/DataTable'
import { PassengerCardModal } from '@/admin/components/PassengerCardModal'
import { Badge } from '@/components/ui/Badge'
import { IconActionButton } from '@/components/ui/IconActionButton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { useListState } from '@/admin/hooks/useListState'
import { Pagination } from '@/admin/components/Pagination'
import { adminErrorMessage } from '@/lib/apiError'

function ExcelIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.2 12.5 15.8 19.5M15.8 12.5 8.2 19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function PassengersRegistryPage() {
  const { showToast } = useToast()
  const { page, setPage, sort, dir, toggleSort } = useListState('addedAtUtc')
  const [flightId, setFlightId] = useState('')
  const [search, setSearch] = useState('')
  const [departureFrom, setDepartureFrom] = useState('')
  const [departureTo, setDepartureTo] = useState('')
  const [exporting, setExporting] = useState(false)
  const [viewingPassenger, setViewingPassenger] = useState<PassengerRegistryItem | null>(null)

  const flights = useQuery({
    queryKey: ['admin', 'flights', 'all-for-filter'],
    queryFn: () => flightsApi.adminList({ page: 1, pageSize: 100, sort: 'departureAtUtc', dir: 'desc' }),
  })

  const filters = {
    flightId: flightId || undefined,
    search: search || undefined,
    departureFromUtc: departureFrom ? new Date(departureFrom).toISOString() : undefined,
    departureToUtc: departureTo ? new Date(departureTo).toISOString() : undefined,
  }

  const registry = useQuery({
    queryKey: ['admin', 'passengers', page, sort, dir, filters],
    queryFn: () => passengersApi.adminList({ page, pageSize: 20, sort, dir, ...filters }),
  })

  async function handleExport() {
    if (exporting) return
    setExporting(true)
    try {
      const blob = await passengersApi.adminExportXlsx(filters)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `passengers-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      showToast(adminErrorMessage('Не удалось экспортировать реестр', error), 'error')
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<PassengerRegistryItem>[] = [
    { key: 'fullName', header: 'ФИО', render: (p) => <span className="font-medium">{p.fullName}</span> },
    { key: 'phone', header: 'Телефон', render: (p) => <span className="text-slate">{p.phone}</span> },
    { key: 'flightNumber', header: 'Рейс', render: (p) => p.flightNumber },
    { key: 'flightDepartureAtUtc', header: 'Дата вылета', render: (p) => new Date(p.flightDepartureAtUtc).toLocaleString('ru') },
    { key: 'source', header: 'Источник', render: (p) => <Badge tone={p.source === 'Crm' ? 'brand' : 'neutral'}>{p.source === 'Crm' ? 'CRM' : 'Вручную'}</Badge> },
    { key: 'addedBy', header: 'Кто добавил', render: (p) => <span className="text-slate">{p.addedByAdminDisplayName ?? '—'}</span> },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <IconActionButton label="Просмотр" onClick={() => setViewingPassenger(p)}>
          <Eye size={16} />
        </IconActionButton>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Реестр пассажиров"
        action={
          <Button size="sm" variant="excel" onClick={handleExport} disabled={exporting}>
            <ExcelIcon size={14} /> {exporting ? 'Excel…' : 'Excel'}
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={flightId} onChange={(e) => { setFlightId(e.target.value); setPage(1) }}>
          <option value="">Все рейсы</option>
          {flights.data?.items.map((f) => (
            <option key={f.id} value={f.id}>
              {f.flightNumber} — {new Date(f.departureAtUtc).toLocaleDateString('ru')}
            </option>
          ))}
        </Select>
        <Input
          placeholder="Поиск по ФИО или телефону"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        <Input
          type="date"
          aria-label="Вылет от"
          value={departureFrom}
          onChange={(e) => { setDepartureFrom(e.target.value); setPage(1) }}
        />
        <Input
          type="date"
          aria-label="Вылет до"
          value={departureTo}
          onChange={(e) => { setDepartureTo(e.target.value); setPage(1) }}
        />
      </div>

      {registry.isPending && <Skeleton className="h-40 w-full" />}
      {registry.isError && <ErrorState onRetry={() => registry.refetch()} />}
      {registry.isSuccess && registry.data.items.length === 0 && <EmptyState title="Пассажиров пока нет" />}
      {registry.isSuccess && registry.data.items.length > 0 && (
        <>
          <DataTable columns={columns} rows={registry.data.items} rowKey={(p) => p.id} sort={sort} dir={dir} onSort={toggleSort} />
          <Pagination page={registry.data.page} totalPages={registry.data.totalPages} onChange={setPage} />
        </>
      )}

      <PassengerCardModal
        passenger={viewingPassenger}
        flightLabel={viewingPassenger ? `${viewingPassenger.flightNumber} — ${new Date(viewingPassenger.flightDepartureAtUtc).toLocaleDateString('ru')}` : ''}
        onClose={() => setViewingPassenger(null)}
        onTransferred={() => setViewingPassenger(null)}
      />
    </div>
  )
}
