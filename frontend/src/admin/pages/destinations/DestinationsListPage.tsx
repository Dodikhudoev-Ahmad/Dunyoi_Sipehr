import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NavLink, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { destinationsApi } from '@/api/destinations'
import type { AdminDestinationListItem } from '@/types/domain'
import { PageHeader } from '@/admin/components/PageHeader'
import { DataTable, type Column } from '@/admin/components/DataTable'
import { ConfirmDeleteButton } from '@/admin/components/ConfirmDeleteButton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { adminErrorMessage } from '@/lib/apiError'
import { useListState } from '@/admin/hooks/useListState'
import { Pagination } from '@/admin/components/Pagination'

export function DestinationsListPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { page, setPage, sort, dir, toggleSort } = useListState('sortOrder')

  const destinations = useQuery({
    queryKey: ['admin', 'destinations', page, sort, dir],
    queryFn: () => destinationsApi.adminList({ page, pageSize: 10, sort, dir }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => destinationsApi.adminDelete(id),
    onSuccess: () => {
      showToast('Направление удалено')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] })
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось удалить направление', error), 'error'),
  })

  const columns: Column<AdminDestinationListItem>[] = [
    { key: 'slug', header: 'Slug', sortable: true, render: (d) => <code className="text-xs text-slate">{d.slug}</code> },
    { key: 'cityName', header: 'Город', render: (d) => d.cityName },
    { key: 'isFeatured', header: 'Избранное', render: (d) => (d.isFeatured ? <Badge tone="accent">Да</Badge> : '—') },
    { key: 'isPublished', header: 'Статус', sortable: true, render: (d) => <Badge tone={d.isPublished ? 'success' : 'neutral'}>{d.isPublished ? 'Опубликовано' : 'Черновик'}</Badge> },
    { key: 'createdAt', header: 'Создано', sortable: true, render: (d) => new Date(d.createdAtUtc).toLocaleDateString('ru') },
    {
      key: 'actions',
      header: '',
      render: (d) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/destinations/${d.id}`)}>
            Редактировать
          </Button>
          <ConfirmDeleteButton onConfirm={() => remove.mutate(d.id)} disabled={remove.isPending} />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Направления"
        action={
          <NavLink to="/admin/destinations/new">
            <Button size="sm">
              <Plus size={15} /> Добавить направление
            </Button>
          </NavLink>
        }
      />
      {destinations.isPending && <Skeleton className="h-40 w-full" />}
      {destinations.isError && <ErrorState onRetry={() => destinations.refetch()} />}
      {destinations.isSuccess && destinations.data.items.length === 0 && <EmptyState title="Направлений пока нет" />}
      {destinations.isSuccess && destinations.data.items.length > 0 && (
        <>
          <DataTable columns={columns} rows={destinations.data.items} rowKey={(d) => d.id} sort={sort} dir={dir} onSort={toggleSort} />
          <Pagination page={destinations.data.page} totalPages={destinations.data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
