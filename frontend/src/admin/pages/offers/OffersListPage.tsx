import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NavLink, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { offersApi } from '@/api/offers'
import type { AdminOfferListItem } from '@/types/domain'
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

export function OffersListPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { page, setPage, sort, dir, toggleSort } = useListState('sortOrder')
  const [deleting, setDeleting] = useState<AdminOfferListItem | null>(null)

  const offers = useQuery({
    queryKey: ['admin', 'offers', page, sort, dir],
    queryFn: () => offersApi.adminList({ page, pageSize: 10, sort, dir }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => offersApi.adminDelete(id),
    onSuccess: () => {
      showToast('Предложение удалено')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] })
      setDeleting(null)
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось удалить предложение', error), 'error'),
  })

  const columns: Column<AdminOfferListItem>[] = [
    { key: 'slug', header: 'Slug', sortable: true, render: (o) => <code className="text-xs text-slate">{o.slug}</code> },
    { key: 'priceFrom', header: 'Цена от', sortable: true, render: (o) => `${o.priceFrom} ${o.currency.toUpperCase()}` },
    { key: 'isFeatured', header: 'Избранное', render: (o) => (o.isFeatured ? <Badge tone="accent">Да</Badge> : '—') },
    { key: 'isPublished', header: 'Статус', sortable: true, render: (o) => <Badge tone={o.isPublished ? 'success' : 'neutral'}>{o.isPublished ? 'Опубликовано' : 'Черновик'}</Badge> },
    {
      key: 'actions',
      header: '',
      render: (o) => (
        <div className="flex items-center justify-end gap-1">
          <IconActionButton label="Редактировать" onClick={() => navigate(`/admin/offers/${o.id}`)}>
            <Pencil size={16} />
          </IconActionButton>
          <IconActionButton label="Удалить" tone="danger" onClick={() => setDeleting(o)}>
            <Trash2 size={16} />
          </IconActionButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Предложения"
        action={
          <NavLink to="/admin/offers/new">
            <Button size="sm">
              <Plus size={15} /> Добавить предложение
            </Button>
          </NavLink>
        }
      />
      {offers.isPending && <Skeleton className="h-40 w-full" />}
      {offers.isError && <ErrorState onRetry={() => offers.refetch()} />}
      {offers.isSuccess && offers.data.items.length === 0 && <EmptyState title="Предложений пока нет" />}
      {offers.isSuccess && offers.data.items.length > 0 && (
        <>
          <DataTable columns={columns} rows={offers.data.items} rowKey={(o) => o.id} sort={sort} dir={dir} onSort={toggleSort} />
          <Pagination page={offers.data.page} totalPages={offers.data.totalPages} onChange={setPage} />
        </>
      )}
      <DeleteConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        isPending={remove.isPending}
        title="Удалить предложение?"
        description={`Предложение «${deleting?.slug}» будет удалено безвозвратно.`}
      />
    </div>
  )
}
