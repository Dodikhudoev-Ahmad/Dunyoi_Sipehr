import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NavLink, useNavigate } from 'react-router-dom'
import { Plus, Pencil } from 'lucide-react'
import { servicesApi } from '@/api/services'
import type { AdminServiceItem } from '@/types/domain'
import { findTranslation } from '@/lib/translations'
import { PageHeader } from '@/admin/components/PageHeader'
import { DataTable, type Column } from '@/admin/components/DataTable'
import { ConfirmDeleteButton } from '@/admin/components/ConfirmDeleteButton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconActionButton } from '@/components/ui/IconActionButton'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { adminErrorMessage } from '@/lib/apiError'

export function ServicesListPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const services = useQuery({ queryKey: ['admin', 'services'], queryFn: () => servicesApi.adminList({ page: 1, pageSize: 100, sort: 'sortOrder' }) })

  const remove = useMutation({
    mutationFn: (id: string) => servicesApi.adminDelete(id),
    onSuccess: () => {
      showToast('Услуга удалена')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'services'] })
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось удалить услугу', error), 'error'),
  })

  const columns: Column<AdminServiceItem>[] = [
    { key: 'name', header: 'Название', render: (s) => findTranslation(s.translations, 'ru')?.name ?? '—' },
    { key: 'isPublished', header: 'Статус', render: (s) => <Badge tone={s.isPublished ? 'success' : 'neutral'}>{s.isPublished ? 'Опубликовано' : 'Черновик'}</Badge> },
    { key: 'sortOrder', header: 'Порядок', render: (s) => s.sortOrder },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <IconActionButton label="Редактировать" onClick={() => navigate(`/admin/services/${s.id}`)}>
            <Pencil size={16} />
          </IconActionButton>
          <ConfirmDeleteButton onConfirm={() => remove.mutate(s.id)} disabled={remove.isPending} />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Услуги"
        action={
          <NavLink to="/admin/services/new">
            <Button size="sm">
              <Plus size={15} /> Добавить услугу
            </Button>
          </NavLink>
        }
      />
      {services.isPending && <Skeleton className="h-40 w-full" />}
      {services.isError && <ErrorState onRetry={() => services.refetch()} />}
      {services.isSuccess && services.data.items.length === 0 && <EmptyState title="Услуг пока нет" />}
      {services.isSuccess && services.data.items.length > 0 && <DataTable columns={columns} rows={services.data.items} rowKey={(s) => s.id} />}
    </div>
  )
}
