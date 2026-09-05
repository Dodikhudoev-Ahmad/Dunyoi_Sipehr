import { apiDelete, apiGet, apiGetBlob, apiPost } from '@/api/client'
import { toQueryString } from '@/api/queryString'
import type { PagedResult } from '@/types/api'
import type {
  ExpenseCategory,
  FinanceFlightLookupItem,
  FinanceSummary,
  FinanceTransaction,
  FinanceTravelRequestLookupItem,
  FlightReportItem,
  MonthlySeriesPoint,
  PaymentMethod,
  Receivable,
} from '@/types/domain'

export interface FinancePeriodFilter {
  fromDate?: string
  toDate?: string
}

/** No date field — the backend always stamps the operation with the server's current date (see
 * UpsertPaymentInput's doc comment on the backend), so it can't be sent from the client. */
export interface CreatePaymentPayload {
  amount: number
  clientName: string
  travelRequestId?: string
  flightId?: string
  method: PaymentMethod
  comment?: string
}

/** Same "always today" rule as CreatePaymentPayload. */
export interface CreateExpensePayload {
  amount: number
  category: ExpenseCategory
  comment?: string
}

export const financeApi = {
  listTransactions: (query: FinancePeriodFilter & { type?: string; page: number; pageSize: number; sort?: string; dir?: 'asc' | 'desc' }) =>
    apiGet<PagedResult<FinanceTransaction>>(`/admin/finance/transactions${toQueryString({
      fromDate: query.fromDate, toDate: query.toDate, type: query.type,
      page: query.page, pageSize: query.pageSize, sortBy: query.sort, sortDir: query.dir,
    })}`),
  exportXlsx: (query: FinancePeriodFilter & { type?: string }) =>
    apiGetBlob(`/admin/finance/transactions/export${toQueryString({ fromDate: query.fromDate, toDate: query.toDate, type: query.type })}`),
  summary: (query: FinancePeriodFilter) =>
    apiGet<FinanceSummary>(`/admin/finance/summary${toQueryString({ fromDate: query.fromDate, toDate: query.toDate })}`),
  receivables: (query: { page: number; pageSize: number }) =>
    apiGet<PagedResult<Receivable>>(`/admin/finance/receivables${toQueryString({ page: query.page, pageSize: query.pageSize })}`),
  flightReport: (query: FinancePeriodFilter) =>
    apiGet<FlightReportItem[]>(`/admin/finance/report/flights${toQueryString({ fromDate: query.fromDate, toDate: query.toDate })}`),
  monthlySeries: (months = 6) => apiGet<MonthlySeriesPoint[]>(`/admin/finance/monthly-series${toQueryString({ months })}`),

  flightsLookup: () => apiGet<FinanceFlightLookupItem[]>('/admin/finance/lookup/flights'),
  travelRequestsLookup: (search?: string) =>
    apiGet<FinanceTravelRequestLookupItem[]>(`/admin/finance/lookup/travel-requests${toQueryString({ search })}`),
  /** Only the flights the given client actually appears on a manifest for — see
   * GetFinanceFlightsForClientQuery on the backend. Always pass exactly one of the two. */
  flightsForClient: (query: { travelRequestId?: string; clientName?: string }) =>
    apiGet<FinanceFlightLookupItem[]>(`/admin/finance/lookup/flights-for-client${toQueryString(query)}`),

  createPayment: (payload: CreatePaymentPayload) => apiPost<{ id: string }>('/admin/finance/payments', payload),
  deletePayment: (id: string) => apiDelete<void>(`/admin/finance/payments/${id}`),
  createExpense: (payload: CreateExpensePayload) => apiPost<{ id: string }>('/admin/finance/expenses', payload),
  deleteExpense: (id: string) => apiDelete<void>(`/admin/finance/expenses/${id}`),
}
