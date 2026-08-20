import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { travelRequestsApi, passportPhotoCacheKey } from '@/api/travelRequests'
import { auditLogApi } from '@/api/auditLog'
import type { TravelRequestStatus } from '@/types/domain'
import { PageHeader } from '@/admin/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { adminErrorMessage } from '@/lib/apiError'

const STATUSES: TravelRequestStatus[] = ['New', 'Contacted', 'Qualified', 'Won', 'Lost']

const STATUS_TONE: Record<TravelRequestStatus, 'brand' | 'warning' | 'accent' | 'success' | 'danger'> = {
  New: 'brand',
  Contacted: 'warning',
  Qualified: 'accent',
  Won: 'success',
  Lost: 'danger',
}

/** Passport photos are never a public URL — fetched as an authenticated blob and rendered via a
 * local object URL, revoked on unmount to avoid leaking the decoded image in memory. */
function PassportPhotoThumb({ requestId, fileName }: { requestId: string; fileName: string }) {
  const photo = useQuery({
    queryKey: ['admin', 'travel-request-photo', passportPhotoCacheKey(requestId, fileName)],
    queryFn: () => travelRequestsApi.adminGetPassportPhotoBlob(requestId, fileName),
  })
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!photo.data) return
    const url = URL.createObjectURL(photo.data)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photo.data])

  if (photo.isPending) return <Skeleton className="h-32 w-32 rounded-lg" />
  if (photo.isError || !objectUrl) {
    return (
      <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-danger/30 bg-danger/5 text-center text-xs text-danger">
        Не удалось загрузить фото
      </div>
    )
  }

  return (
    <a href={objectUrl} target="_blank" rel="noreferrer" className="block h-32 w-32 overflow-hidden rounded-lg border border-text/15">
      <img src={objectUrl} alt="Фото паспорта" className="h-full w-full object-cover" />
    </a>
  )
}

export function TravelRequestDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const request = useQuery({ queryKey: ['admin', 'travel-request', id], queryFn: () => travelRequestsApi.adminGet(id) })
  const audit = useQuery({
    queryKey: ['admin', 'audit-log', 'TravelRequest', id],
    queryFn: () => auditLogApi.list({ entityType: 'TravelRequest', entityId: id, page: 1, pageSize: 20 }),
  })

  const setStatus = useMutation({
    mutationFn: (status: TravelRequestStatus) => travelRequestsApi.adminSetStatus(id, status),
    onSuccess: () => {
      showToast('Статус обновлён')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'travel-request', id] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'travel-requests'] })
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось обновить статус', error), 'error'),
  })

  if (request.isPending) return <Skeleton className="h-64 w-full" />
  if (request.isError) return <ErrorState onRetry={() => request.refetch()} />

  const r = request.data

  return (
    <div>
      <button onClick={() => navigate('/admin/travel-requests')} className="mb-4 flex items-center gap-1 text-sm text-slate hover:text-text">
        <ArrowLeft size={14} /> К списку заявок
      </button>
      <PageHeader title={r.fullName} action={<Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="space-y-3 p-6 lg:col-span-2">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
            <div><dt className="text-slate">Эл. почта</dt><dd className="font-medium">{r.email}</dd></div>
            <div><dt className="text-slate">Телефон</dt><dd className="font-medium">{r.phone}</dd></div>
            <div><dt className="text-slate">Направление</dt><dd className="font-medium">{r.destinationSnapshotTitle ?? '—'}</dd></div>
            <div><dt className="text-slate">Предложение</dt><dd className="font-medium">{r.offerSnapshotTitle ?? '—'}</dd></div>
            <div><dt className="text-slate">Взрослые / дети</dt><dd className="font-medium">{r.passengersAdults} / {r.passengersChildren}</dd></div>
            {r.childrenAges.length > 0 && (
              <div><dt className="text-slate">Возраст детей</dt><dd className="font-medium">{r.childrenAges.join(', ')}</dd></div>
            )}
            <div><dt className="text-slate">Дата вылета</dt><dd className="font-medium">{r.departureDate}</dd></div>
            <div><dt className="text-slate">Дата возврата</dt><dd className="font-medium">{r.returnDate ?? '—'}</dd></div>
            <div><dt className="text-slate">Локаль</dt><dd className="font-medium">{r.preferredLocale}</dd></div>
            <div><dt className="text-slate">Создано</dt><dd className="font-medium">{new Date(r.createdAtUtc).toLocaleString('ru')}</dd></div>
            <div><dt className="text-slate">Согласие получено</dt><dd className="font-medium">{new Date(r.consentAcceptedAtUtc).toLocaleString('ru')}</dd></div>
            <div><dt className="text-slate">Согласие на паспортные данные</dt><dd className="font-medium">{new Date(r.passportDataConsentAcceptedAtUtc).toLocaleString('ru')}</dd></div>
          </dl>
          {r.message && (
            <div className="pt-2">
              <p className="text-sm text-slate">Сообщение</p>
              <p className="mt-1 whitespace-pre-line">{r.message}</p>
            </div>
          )}
          {r.passportPhotoPaths.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-sm text-slate">Фото паспорта</p>
              <div className="flex flex-wrap gap-3">
                {r.passportPhotoPaths.map((fileName) => (
                  <PassportPhotoThumb key={fileName} requestId={r.id} fileName={fileName} />
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="space-y-3 p-6">
          <p className="text-sm font-medium text-slate">Изменить статус</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === r.status ? 'primary' : 'secondary'}
                disabled={setStatus.isPending}
                onClick={() => setStatus.mutate(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-medium">Журнал изменений</h2>
        {audit.isPending && <Skeleton className="h-24 w-full" />}
        {audit.isError && <ErrorState onRetry={() => audit.refetch()} />}
        {audit.isSuccess && audit.data.items.length === 0 && <EmptyState title="Изменений пока нет" />}
        {audit.isSuccess && audit.data.items.length > 0 && (
          <ul className="space-y-2">
            {audit.data.items.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-text/8 bg-elevated px-4 py-2.5 text-sm">
                <span className="font-medium">{entry.action}</span>{' '}
                <span className="text-slate">— {new Date(entry.timestamp).toLocaleString('ru')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
