import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Eye, Plus, Trash2 } from 'lucide-react'
import { flightsApi } from '@/api/flights'
import type { FlightPassenger } from '@/types/domain'
import { PageHeader } from '@/admin/components/PageHeader'
import { DataTable, type Column } from '@/admin/components/DataTable'
import { AddPassengerModal } from '@/admin/components/AddPassengerModal'
import { FlightFormModal } from '@/admin/components/FlightFormModal'
import { DeleteConfirmModal } from '@/admin/components/DeleteConfirmModal'
import { PassengerCardModal } from '@/admin/components/PassengerCardModal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconActionButton } from '@/components/ui/IconActionButton'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { adminErrorMessage } from '@/lib/apiError'
import { FLIGHT_STATUS_LABEL, FLIGHT_STATUS_TONE } from '@/admin/lib/flightStatus'

/** Same Excel-brand mark used on the travel-requests export button — see that page's ExcelIcon
 * for why it's a bespoke SVG instead of a generic download icon. */
function ExcelIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.2 12.5 15.8 19.5M15.8 12.5 8.2 19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function FlightDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [addPassengerOpen, setAddPassengerOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [viewingPassenger, setViewingPassenger] = useState<FlightPassenger | null>(null)
  const [deletingPassenger, setDeletingPassenger] = useState<FlightPassenger | null>(null)

  const flightKey = ['admin', 'flight', id]
  const passengersKey = ['admin', 'flight-passengers', id]

  const flight = useQuery({ queryKey: flightKey, queryFn: () => flightsApi.adminGet(id) })
  const passengers = useQuery({ queryKey: passengersKey, queryFn: () => flightsApi.adminListPassengers(id) })

  const update = useMutation({
    mutationFn: (payload: Parameters<typeof flightsApi.adminUpdate>[1]) => flightsApi.adminUpdate(id, payload),
    onSuccess: () => {
      showToast('Рейс изменён')
      void queryClient.invalidateQueries({ queryKey: flightKey })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'flights'] })
      setEditOpen(false)
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось изменить рейс', error), 'error'),
  })

  const removePassenger = useMutation({
    mutationFn: (passengerId: string) => flightsApi.adminDeletePassenger(id, passengerId),
    onSuccess: () => {
      showToast('Участник удалён')
      void queryClient.invalidateQueries({ queryKey: passengersKey })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'flights'] })
      setDeletingPassenger(null)
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось удалить участника', error), 'error'),
  })

  async function handleExport() {
    if (exporting) return
    setExporting(true)
    try {
      const blob = await flightsApi.adminExportXlsx(id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `flight-${flight.data?.flightNumber ?? id}-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      showToast(adminErrorMessage('Не удалось экспортировать участников', error), 'error')
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<FlightPassenger>[] = [
    { key: 'fullName', header: 'ФИО', render: (p) => <span className="font-medium">{p.fullName}</span> },
    { key: 'phone', header: 'Телефон', render: (p) => <span className="text-slate">{p.phone}</span> },
    { key: 'source', header: 'Источник', render: (p) => <Badge tone={p.source === 'Crm' ? 'brand' : 'neutral'}>{p.source === 'Crm' ? 'CRM' : 'Вручную'}</Badge> },
    { key: 'addedBy', header: 'Кто добавил', render: (p) => <span className="text-slate">{p.addedByAdminDisplayName ?? '—'}</span> },
    { key: 'addedAtUtc', header: 'Дата добавления', render: (p) => new Date(p.addedAtUtc).toLocaleString('ru') },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <IconActionButton label="Просмотр" onClick={() => setViewingPassenger(p)}>
            <Eye size={16} />
          </IconActionButton>
          <IconActionButton label="Удалить" tone="danger" onClick={() => setDeletingPassenger(p)}>
            <Trash2 size={16} />
          </IconActionButton>
        </div>
      ),
    },
  ]

  if (flight.isPending) return <Skeleton className="h-64 w-full" />
  if (flight.isError) return <ErrorState onRetry={() => flight.refetch()} />

  const f = flight.data

  return (
    <div>
      <button onClick={() => navigate('/admin/flights')} className="mb-4 flex items-center gap-1 text-sm text-slate hover:text-text">
        <ArrowLeft size={14} /> К списку рейсов
      </button>

      <PageHeader
        title={f.flightNumber}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={FLIGHT_STATUS_TONE[f.status]}>{FLIGHT_STATUS_LABEL[f.status]}</Badge>
            <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
              Изменить
            </Button>
          </div>
        }
      />

      <Card className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-2 p-6 text-sm">
        <div>
          <p className="text-slate">Маршрут</p>
          <p className="font-medium">{f.originCity} → {f.destinationCity}</p>
        </div>
        <div>
          <p className="text-slate">Дата и время вылета</p>
          <p className="font-medium">{new Date(f.departureAtUtc).toLocaleString('ru')}</p>
        </div>
        <div>
          <p className="text-slate">Пассажиров</p>
          <p className="font-medium">{passengers.data?.length ?? '—'}</p>
        </div>
      </Card>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Участники</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="excel" onClick={handleExport} disabled={exporting}>
            <ExcelIcon size={14} /> {exporting ? 'Excel…' : 'Excel'}
          </Button>
          <Button size="sm" onClick={() => setAddPassengerOpen(true)}>
            <Plus size={15} /> Добавить участника
          </Button>
        </div>
      </div>

      {passengers.isPending && <Skeleton className="h-40 w-full" />}
      {passengers.isError && <ErrorState onRetry={() => passengers.refetch()} />}
      {passengers.isSuccess && passengers.data.length === 0 && <EmptyState title="Участников пока нет" />}
      {passengers.isSuccess && passengers.data.length > 0 && (
        <DataTable columns={columns} rows={passengers.data} rowKey={(p) => p.id} />
      )}

      <AddPassengerModal open={addPassengerOpen} onClose={() => setAddPassengerOpen(false)} flightId={id} />
      <FlightFormModal open={editOpen} onClose={() => setEditOpen(false)} onSubmit={(payload) => update.mutate(payload)} isPending={update.isPending} flight={f} />
      <PassengerCardModal
        passenger={viewingPassenger}
        flightLabel={`${f.flightNumber} — ${f.originCity} → ${f.destinationCity}`}
        onClose={() => setViewingPassenger(null)}
        onTransferred={() => setViewingPassenger(null)}
      />
      <DeleteConfirmModal
        open={deletingPassenger !== null}
        onClose={() => setDeletingPassenger(null)}
        onConfirm={() => deletingPassenger && removePassenger.mutate(deletingPassenger.id)}
        isPending={removePassenger.isPending}
        title="Удалить участника?"
        description={`${deletingPassenger?.fullName} будет удалён из рейса.`}
      />
    </div>
  )
}
