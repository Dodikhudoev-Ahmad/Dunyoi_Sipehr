import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditLogApi } from '@/api/auditLog'
import type { AuditLog } from '@/types/domain'
import { PageHeader } from '@/admin/components/PageHeader'
import { DataTable, type Column } from '@/admin/components/DataTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { FieldLabel } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Pagination } from '@/admin/components/Pagination'

// Mirrors the EntityType strings actually logged via nameof(...) across every
// db.AuditLogs.Add(new AuditLog(...)) call site (backend/Application/Features/*/Commands) --
// display-only, the raw value is still what's sent as the filter query param.
const ENTITY_TYPE_LABEL: Record<string, string> = {
  Country: 'Страна',
  City: 'Город',
  Destination: 'Направление',
  Offer: 'Предложение',
  Service: 'Услуга',
  Testimonial: 'Отзыв',
  FaqItem: 'Вопрос (FAQ)',
  SiteContent: 'Контент сайта',
  TravelRequest: 'Заявка',
  AdminUser: 'Сотрудник',
}

// Mirrors the Action strings used at the same call sites.
const ACTION_LABEL: Record<string, string> = {
  Create: 'Создание',
  Update: 'Изменение',
  Delete: 'Удаление',
  StatusChange: 'Смена статуса',
  Assign: 'Назначение',
  SetDealValue: 'Указание суммы сделки',
  SetFollowUp: 'Напоминание',
  ResetPassword: 'Сброс пароля',
}

function adminLabel(l: AuditLog): string {
  if (l.adminUserId == null) return 'Система'
  if (l.adminDisplayName) return l.adminDisplayName
  // Genuinely orphaned reference (no matching AdminUsers row) -- shouldn't normally happen since
  // staff are only deactivated, never hard-deleted, but fall back to a short id rather than
  // breaking or showing the full UUID.
  return `Неизвестный администратор (${l.adminUserId.slice(0, 8)})`
}

export function AuditLogPage() {
  const [entityType, setEntityType] = useState('')
  const [page, setPage] = useState(1)

  const log = useQuery({
    queryKey: ['admin', 'audit-log', entityType, page],
    queryFn: () => auditLogApi.list({ entityType: entityType || undefined, page, pageSize: 20 }),
  })

  const columns: Column<AuditLog>[] = [
    { key: 'timestampUtc', header: 'Время', render: (l) => new Date(l.timestampUtc).toLocaleString('ru') },
    { key: 'entityType', header: 'Сущность', render: (l) => ENTITY_TYPE_LABEL[l.entityType] ?? l.entityType },
    { key: 'action', header: 'Действие', render: (l) => ACTION_LABEL[l.action] ?? l.action },
    { key: 'adminUserId', header: 'Администратор', render: (l) => adminLabel(l) },
  ]

  return (
    <div>
      <PageHeader title="Журнал аудита" />

      <div className="mb-6 max-w-xs">
        <FieldLabel htmlFor="entityType">Фильтр по типу сущности</FieldLabel>
        <Select
          id="entityType"
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Все типы</option>
          {Object.entries(ENTITY_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {log.isPending && <Skeleton className="h-40 w-full" />}
      {log.isError && <ErrorState onRetry={() => log.refetch()} />}
      {log.isSuccess && log.data.items.length === 0 && <EmptyState title="Записей пока нет" />}
      {log.isSuccess && log.data.items.length > 0 && (
        <>
          <DataTable columns={columns} rows={log.data.items} rowKey={(l) => l.id} />
          <Pagination page={log.data.page} totalPages={log.data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
