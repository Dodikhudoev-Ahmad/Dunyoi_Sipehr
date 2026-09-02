import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NavLink, useNavigate } from 'react-router-dom'
import { Plus, Star, Pencil, Trash2 } from 'lucide-react'
import { testimonialsApi } from '@/api/testimonials'
import type { AdminTestimonialItem } from '@/types/domain'
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

export function TestimonialsListPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState<AdminTestimonialItem | null>(null)
  const testimonials = useQuery({
    queryKey: ['admin', 'testimonials'],
    queryFn: () => testimonialsApi.adminList({ page: 1, pageSize: 100, sort: 'sortOrder' }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => testimonialsApi.adminDelete(id),
    onSuccess: () => {
      showToast('Отзыв удалён')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] })
      setDeleting(null)
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось удалить отзыв', error), 'error'),
  })

  const columns: Column<AdminTestimonialItem>[] = [
    { key: 'authorName', header: 'Автор', render: (t) => t.authorName },
    { key: 'authorCountry', header: 'Страна', render: (t) => t.authorCountry },
    { key: 'rating', header: 'Рейтинг', render: (t) => <span className="flex items-center gap-1"><Star size={13} className="text-brand" fill="currentColor" /> {t.rating}</span> },
    { key: 'isPublished', header: 'Статус', render: (t) => <Badge tone={t.isPublished ? 'success' : 'neutral'}>{t.isPublished ? 'Опубликовано' : 'Черновик'}</Badge> },
    {
      key: 'actions',
      header: '',
      render: (t) => (
        <div className="flex items-center justify-end gap-1">
          <IconActionButton label="Редактировать" onClick={() => navigate(`/admin/testimonials/${t.id}`)}>
            <Pencil size={16} />
          </IconActionButton>
          <IconActionButton label="Удалить" tone="danger" onClick={() => setDeleting(t)}>
            <Trash2 size={16} />
          </IconActionButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Отзывы"
        action={
          <NavLink to="/admin/testimonials/new">
            <Button size="sm">
              <Plus size={15} /> Добавить отзыв
            </Button>
          </NavLink>
        }
      />
      {testimonials.isPending && <Skeleton className="h-40 w-full" />}
      {testimonials.isError && <ErrorState onRetry={() => testimonials.refetch()} />}
      {testimonials.isSuccess && testimonials.data.items.length === 0 && <EmptyState title="Отзывов пока нет" />}
      {testimonials.isSuccess && testimonials.data.items.length > 0 && (
        <DataTable columns={columns} rows={testimonials.data.items} rowKey={(t) => t.id} />
      )}
      <DeleteConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        isPending={remove.isPending}
        title="Удалить отзыв?"
        description={`Отзыв от «${deleting?.authorName}» будет удалён безвозвратно.`}
      />
    </div>
  )
}
