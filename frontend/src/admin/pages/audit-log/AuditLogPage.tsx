import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditLogApi } from '@/api/auditLog'
import type { AuditLog } from '@/types/domain'
import { PageHeader } from '@/admin/components/PageHeader'
import { DataTable, type Column } from '@/admin/components/DataTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, FieldLabel } from '@/components/ui/Input'
import { Pagination } from '@/admin/components/Pagination'

export function AuditLogPage() {
  const [entityType, setEntityType] = useState('')
  const [page, setPage] = useState(1)

  const log = useQuery({
    queryKey: ['admin', 'audit-log', entityType, page],
    queryFn: () => auditLogApi.list({ entityType: entityType || undefined, page, pageSize: 20 }),
  })

  const columns: Column<AuditLog>[] = [
    { key: 'timestamp', header: 'Время', render: (l) => new Date(l.timestamp).toLocaleString('ru') },
    { key: 'entityType', header: 'Сущность', render: (l) => l.entityType },
    { key: 'action', header: 'Действие', render: (l) => l.action },
    { key: 'adminUserId', header: 'Администратор', render: (l) => l.adminUserId ?? 'система' },
  ]

  return (
    <div>
      <PageHeader title="Журнал аудита" />

      <div className="mb-6 max-w-xs">
        <FieldLabel htmlFor="entityType">Фильтр по типу сущности</FieldLabel>
        <Input
          id="entityType"
          placeholder="например, Destination"
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value)
            setPage(1)
          }}
        />
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
