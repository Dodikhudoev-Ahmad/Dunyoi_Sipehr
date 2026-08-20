import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { travelRequestsApi } from '@/api/travelRequests'
import type { TravelRequest, TravelRequestStatus } from '@/types/domain'
import { PageHeader } from '@/admin/components/PageHeader'
import { DataTable, type Column } from '@/admin/components/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useListState } from '@/admin/hooks/useListState'
import { Pagination } from '@/admin/components/Pagination'
import { Select } from '@/components/ui/Input'

const STATUSES: TravelRequestStatus[] = ['New', 'Contacted', 'Qualified', 'Won', 'Lost']

const STATUS_TONE: Record<TravelRequestStatus, 'brand' | 'warning' | 'accent' | 'success' | 'danger'> = {
  New: 'brand',
  Contacted: 'warning',
  Qualified: 'accent',
  Won: 'success',
  Lost: 'danger',
}

export function TravelRequestsListPage() {
  const navigate = useNavigate()
  const { page, setPage, sort, dir, toggleSort } = useListState('createdAtUtc')
  const [status, setStatus] = useState<TravelRequestStatus | ''>('')

  const requests = useQuery({
    queryKey: ['admin', 'travel-requests', page, sort, dir, status],
    queryFn: () => travelRequestsApi.adminList({ page, pageSize: 15, sort, dir, status: status || undefined }),
  })

  const columns: Column<TravelRequest>[] = [
    { key: 'createdAtUtc', header: 'Дата', sortable: true, render: (r) => new Date(r.createdAtUtc).toLocaleString('ru') },
    { key: 'fullName', header: 'Имя', render: (r) => r.fullName },
    { key: 'email', header: 'Контакты', render: (r) => <span className="text-slate">{r.email} · {r.phone}</span> },
    { key: 'destination', header: 'Направление', render: (r) => r.destinationSnapshotTitle ?? r.offerSnapshotTitle ?? '—' },
    { key: 'status', header: 'Статус', sortable: true, render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
  ]

  return (
    <div>
      <PageHeader
        title="Заявки на путешествие"
        action={
          <Select value={status} onChange={(e) => { setStatus(e.target.value as TravelRequestStatus | ''); setPage(1) }} className="w-48">
            <option value="">Все статусы</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
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
          />
          <Pagination page={requests.data.page} totalPages={requests.data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
