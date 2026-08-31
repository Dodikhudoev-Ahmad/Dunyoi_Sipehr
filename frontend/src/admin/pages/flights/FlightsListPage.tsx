import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil } from 'lucide-react'
import { flightsApi, type UpsertFlightPayload } from '@/api/flights'
import type { Flight } from '@/types/domain'
import { PageHeader } from '@/admin/components/PageHeader'
import { DataTable, type Column } from '@/admin/components/DataTable'
import { FlightFormModal } from '@/admin/components/FlightFormModal'
import { ConfirmDeleteButton } from '@/admin/components/ConfirmDeleteButton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconActionButton } from '@/components/ui/IconActionButton'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { useListState } from '@/admin/hooks/useListState'
import { Pagination } from '@/admin/components/Pagination'
import { adminErrorMessage } from '@/lib/apiError'
import { FLIGHT_STATUS_LABEL, FLIGHT_STATUS_TONE } from '@/admin/lib/flightStatus'

const FLIGHTS_KEY = ['admin', 'flights']

export function FlightsListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const { page, setPage, sort, dir, toggleSort } = useListState('departureAtUtc')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Flight | null>(null)

  const flights = useQuery({
    queryKey: [...FLIGHTS_KEY, page, sort, dir],
    queryFn: () => flightsApi.adminList({ page, pageSize: 15, sort, dir }),
  })

  const create = useMutation({
    mutationFn: (payload: UpsertFlightPayload) => flightsApi.adminCreate(payload),
    onSuccess: () => {
      showToast('Рейс добавлен')
      void queryClient.invalidateQueries({ queryKey: FLIGHTS_KEY })
      setAddOpen(false)
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось добавить рейс', error), 'error'),
  })

  const update = useMutation({
    mutationFn: (payload: UpsertFlightPayload) => flightsApi.adminUpdate(editing!.id, payload),
    onSuccess: () => {
      showToast('Рейс изменён')
      void queryClient.invalidateQueries({ queryKey: FLIGHTS_KEY })
      setEditing(null)
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось изменить рейс', error), 'error'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => flightsApi.adminDelete(id),
    onSuccess: () => {
      showToast('Рейс удалён')
      void queryClient.invalidateQueries({ queryKey: FLIGHTS_KEY })
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось удалить рейс', error), 'error'),
  })

  const columns: Column<Flight>[] = [
    { key: 'flightNumber', header: 'Номер рейса', sortable: true, render: (f) => <span className="font-medium">{f.flightNumber}</span> },
    { key: 'route', header: 'Маршрут', render: (f) => `${f.originCity} → ${f.destinationCity}` },
    { key: 'departureAtUtc', header: 'Дата и время', sortable: true, render: (f) => new Date(f.departureAtUtc).toLocaleString('ru') },
    { key: 'status', header: 'Статус', sortable: true, render: (f) => <Badge tone={FLIGHT_STATUS_TONE[f.status]}>{FLIGHT_STATUS_LABEL[f.status]}</Badge> },
    { key: 'passengerCount', header: 'Пассажиров', render: (f) => f.passengerCount },
    {
      key: 'actions',
      header: '',
      render: (f) => (
        <div className="flex items-center justify-end gap-1">
          <button className="mr-1 text-sm font-medium text-brand" onClick={() => navigate(`/admin/flights/${f.id}`)}>
            Открыть
          </button>
          <IconActionButton label="Изменить" onClick={() => setEditing(f)}>
            <Pencil size={16} />
          </IconActionButton>
          <ConfirmDeleteButton onConfirm={() => remove.mutate(f.id)} disabled={remove.isPending} />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Рейсы"
        action={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={15} /> Добавить рейс
          </Button>
        }
      />
      {flights.isPending && <Skeleton className="h-40 w-full" />}
      {flights.isError && <ErrorState onRetry={() => flights.refetch()} />}
      {flights.isSuccess && flights.data.items.length === 0 && <EmptyState title="Рейсов пока нет" />}
      {flights.isSuccess && flights.data.items.length > 0 && (
        <>
          <DataTable
            columns={columns}
            rows={flights.data.items}
            rowKey={(f) => f.id}
            sort={sort}
            dir={dir}
            onSort={toggleSort}
          />
          <Pagination page={flights.data.page} totalPages={flights.data.totalPages} onChange={setPage} />
        </>
      )}

      <FlightFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(payload) => create.mutate(payload)}
        isPending={create.isPending}
      />
      <FlightFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSubmit={(payload) => update.mutate(payload)}
        isPending={update.isPending}
        flight={editing ?? undefined}
      />
    </div>
  )
}
