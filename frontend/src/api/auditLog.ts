import { apiGet } from '@/api/client'
import { toQueryString } from '@/api/queryString'
import type { PagedResult } from '@/types/api'
import type { AuditLog } from '@/types/domain'

export const auditLogApi = {
  list: (query: { entityType?: string; entityId?: string; page?: number; pageSize?: number }) =>
    apiGet<PagedResult<AuditLog>>(`/admin/audit-log${toQueryString({ ...query })}`),
}
