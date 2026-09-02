import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NavLink, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { faqApi } from '@/api/faq'
import type { AdminFaqItem } from '@/types/domain'
import { findTranslation } from '@/lib/translations'
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

export function FaqListPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const faq = useQuery({ queryKey: ['admin', 'faq'], queryFn: () => faqApi.adminList({ page: 1, pageSize: 100, sort: 'sortOrder' }) })
  const [deleting, setDeleting] = useState<AdminFaqItem | null>(null)

  const remove = useMutation({
    mutationFn: (id: string) => faqApi.adminDelete(id),
    onSuccess: () => {
      showToast('Вопрос удалён')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'faq'] })
      setDeleting(null)
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось удалить вопрос', error), 'error'),
  })

  const columns: Column<AdminFaqItem>[] = [
    { key: 'question', header: 'Вопрос', render: (f) => findTranslation(f.translations, 'ru')?.question ?? '—' },
    { key: 'category', header: 'Категория', render: (f) => f.category },
    { key: 'isPublished', header: 'Статус', render: (f) => <Badge tone={f.isPublished ? 'success' : 'neutral'}>{f.isPublished ? 'Опубликовано' : 'Черновик'}</Badge> },
    {
      key: 'actions',
      header: '',
      render: (f) => (
        <div className="flex items-center justify-end gap-1">
          <IconActionButton label="Редактировать" onClick={() => navigate(`/admin/faq/${f.id}`)}>
            <Pencil size={16} />
          </IconActionButton>
          <IconActionButton label="Удалить" tone="danger" onClick={() => setDeleting(f)}>
            <Trash2 size={16} />
          </IconActionButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Вопросы и ответы"
        action={
          <NavLink to="/admin/faq/new">
            <Button size="sm">
              <Plus size={15} /> Добавить вопрос
            </Button>
          </NavLink>
        }
      />
      {faq.isPending && <Skeleton className="h-40 w-full" />}
      {faq.isError && <ErrorState onRetry={() => faq.refetch()} />}
      {faq.isSuccess && faq.data.items.length === 0 && <EmptyState title="Вопросов пока нет" />}
      {faq.isSuccess && faq.data.items.length > 0 && <DataTable columns={columns} rows={faq.data.items} rowKey={(f) => f.id} />}
      <DeleteConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        isPending={remove.isPending}
        title="Удалить вопрос?"
        description={`Вопрос «${deleting ? (findTranslation(deleting.translations, 'ru')?.question ?? '') : ''}» будет удалён безвозвратно.`}
      />
    </div>
  )
}
