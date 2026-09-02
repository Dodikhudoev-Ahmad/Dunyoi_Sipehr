import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NavLink, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { destinationsApi } from '@/api/destinations'
import type { AdminDestinationListItem } from '@/types/domain'
import { PageHeader } from '@/admin/components/PageHeader'
import { DataTable, type Column } from '@/admin/components/DataTable'
import { DeleteConfirmModal } from '@/admin/components/DeleteConfirmModal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconActionButton } from '@/components/ui/IconActionButton'
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
  const [deleting, setDeleting] = useState<AdminDestinationListItem | null>(null)

  const destinations = useQuery({
    queryKey: ['admin', 'destinations', page, sort, dir],
    queryFn: () => destinationsApi.adminList({ page, pageSize: 10, sort, dir }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => destinationsApi.adminDelete(id),
    onSuccess: () => {
      showToast('Направление удалено')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] })
      setDeleting(null)
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
        <div className="flex items-center justify-end gap-1">
          <IconActionButton label="Редактировать" onClick={() => navigate(`/admin/destinations/${d.id}`)}>
            <Pencil size={16} />
          </IconActionButton>
          <IconActionButton label="Удалить" tone="danger" onClick={() => setDeleting(d)}>
            <Trash2 size={16} />
          </IconActionButton>
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
      <DeleteConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        isPending={remove.isPending}
        title="Удалить направление?"
        description={`Направление «${deleting?.slug}» будет удалено безвозвратно.`}
      />
    </div>
  )
}
