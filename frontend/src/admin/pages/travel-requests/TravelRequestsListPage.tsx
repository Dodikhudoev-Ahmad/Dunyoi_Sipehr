import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Download, AlertTriangle } from 'lucide-react'
import { travelRequestsApi } from '@/api/travelRequests'
import type { TravelRequest, TravelRequestStatus } from '@/types/domain'
import { PageHeader } from '@/admin/components/PageHeader'
import { DataTable, type Column } from '@/admin/components/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { useListState } from '@/admin/hooks/useListState'
import { Pagination } from '@/admin/components/Pagination'
import { Select } from '@/components/ui/Input'
import { adminErrorMessage } from '@/lib/apiError'
import { STATUS_ORDER, STATUS_LABEL, STATUS_TONE, isFollowUpOverdue } from '@/admin/lib/requestStatus'

export function TravelRequestsListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { page, setPage, sort, dir, toggleSort } = useListState('createdAtUtc')
  const [status, setStatus] = useState<TravelRequestStatus | ''>('')
  const [exporting, setExporting] = useState(false)

  const requests = useQuery({
    queryKey: ['admin', 'travel-requests', page, sort, dir, status],
    queryFn: () => travelRequestsApi.adminList({ page, pageSize: 15, sort, dir, status: status || undefined }),
  })

  async function handleExport() {
    if (exporting) return
    setExporting(true)
    try {
      const blob = await travelRequestsApi.adminExportXlsx({ status: status || undefined })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `travel-requests-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      showToast(adminErrorMessage('Не удалось экспортировать заявки', error), 'error')
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<TravelRequest>[] = [
    { key: 'createdAtUtc', header: 'Дата', sortable: true, render: (r) => new Date(r.createdAtUtc).toLocaleString('ru') },
    { key: 'fullName', header: 'ФИО', render: (r) => [r.lastName, r.firstName, r.middleName].filter(Boolean).join(' ') },
    { key: 'phone', header: 'Телефон', render: (r) => <span className="text-slate">{r.phone}</span> },
    { key: 'destination', header: 'Направление', render: (r) => r.destinationSnapshotTitle ?? r.offerSnapshotTitle ?? '—' },
    { key: 'status', header: 'Статус', sortable: true, render: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge> },
    {
      key: 'dealValue',
      header: 'Сумма сделки',
      render: (r) => (r.dealValue != null ? <span className="font-medium">{r.dealValue.toLocaleString('ru')} {r.dealCurrency}</span> : <span className="text-slate">—</span>),
    },
    {
      key: 'followUp',
      header: 'Напоминание',
      render: (r) =>
        r.nextFollowUpAtUtc ? (
          <span className={isFollowUpOverdue(r) ? 'flex items-center gap-1 font-medium text-danger' : 'text-slate'}>
            {isFollowUpOverdue(r) && <AlertTriangle size={13} />}
            {new Date(r.nextFollowUpAtUtc).toLocaleDateString('ru')}
          </span>
        ) : (
          <span className="text-slate">—</span>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Заявки на путешествие"
        action={
          <div className="flex items-center gap-2">
            <Select value={status} onChange={(e) => { setStatus(e.target.value as TravelRequestStatus | ''); setPage(1) }} className="w-48">
              <option value="">Все статусы</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
            <Button size="sm" variant="secondary" onClick={handleExport} disabled={exporting}>
              <Download size={14} /> {exporting ? 'Экспорт…' : 'Экспорт в Excel'}
            </Button>
          </div>
        }
      />
      {requests.isPending && <Skeleton className="h-40 w-full" />}
      {requests.isError && <ErrorState onRetry={() => requests.refetch()} />}
      {requests.isSuccess && requests.data.items.length === 0 && <EmptyState title="Заявок пока нет" />}
      {requests.isSuccess && requests.data.items.length > 0 && (
        <>
          <DataTable
            columns={[
              ...columns,
              {
                key: 'open',
                header: '',
                render: (r) => (
                  <button className="text-sm font-medium text-brand" onClick={() => navigate(`/admin/travel-requests/${r.id}`)}>
                    Открыть
                  </button>
                ),
              },
            ]}
            rows={requests.data.items}
            rowKey={(r) => r.id}
            sort={sort}
            dir={dir}
            onSort={toggleSort}
            rowClassName={(r) => (isFollowUpOverdue(r) ? 'bg-danger/5' : undefined)}
          />
          <Pagination page={requests.data.page} totalPages={requests.data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
