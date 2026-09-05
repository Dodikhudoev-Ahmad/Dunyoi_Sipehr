import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { financeApi } from '@/api/finance'
import type { FinanceTransaction } from '@/types/domain'
import { PageHeader } from '@/admin/components/PageHeader'
import { DataTable, type Column } from '@/admin/components/DataTable'
import { Pagination } from '@/admin/components/Pagination'
import { DeleteConfirmModal } from '@/admin/components/DeleteConfirmModal'
import { PeriodFilter, presetToRange, type Period } from '@/admin/components/finance/PeriodFilter'
import { FinanceChart } from '@/admin/components/finance/FinanceChart'
import { AddPaymentModal } from '@/admin/components/finance/AddPaymentModal'
import { AddExpenseModal } from '@/admin/components/finance/AddExpenseModal'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { IconActionButton } from '@/components/ui/IconActionButton'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { useListState } from '@/admin/hooks/useListState'
import { adminErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/cn'
import { formatMoney, categoryOrMethodLabel } from '@/admin/lib/financeLabels'

function ExcelIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.2 12.5 15.8 19.5M15.8 12.5 8.2 19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: typeof Wallet; label: string; value: string; tone: string }) {
  return (
    <Card className="p-5">
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tone)}>
        <Icon size={19} />
      </div>
      <p className="mt-4 truncate text-2xl font-medium">{value}</p>
      <p className="mt-1 text-sm text-slate">{label}</p>
    </Card>
  )
}

type TypeFilter = 'all' | 'Income' | 'Expense'

export function FinancePage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState<Period>({ preset: 'month', ...presetToRange('month') })
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const { page, setPage, sort, dir, toggleSort } = useListState('date')
  const [addPaymentOpen, setAddPaymentOpen] = useState(false)
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [deleting, setDeleting] = useState<FinanceTransaction | null>(null)
  const [exporting, setExporting] = useState(false)

  const periodQuery = { fromDate: period.fromDate, toDate: period.toDate }

  const summary = useQuery({
    queryKey: ['admin', 'finance', 'summary', periodQuery],
    queryFn: () => financeApi.summary(periodQuery),
  })

  const monthlySeries = useQuery({
    queryKey: ['admin', 'finance', 'monthly-series'],
    queryFn: () => financeApi.monthlySeries(6),
  })

  const receivables = useQuery({
    queryKey: ['admin', 'finance', 'receivables'],
    queryFn: () => financeApi.receivables({ page: 1, pageSize: 10 }),
  })

  const flightReport = useQuery({
    queryKey: ['admin', 'finance', 'flight-report', periodQuery],
    queryFn: () => financeApi.flightReport(periodQuery),
  })

  const transactionsFilter = { ...periodQuery, type: typeFilter === 'all' ? undefined : typeFilter }
  const transactions = useQuery({
    queryKey: ['admin', 'finance', 'transactions', transactionsFilter, page, sort, dir],
    queryFn: () => financeApi.listTransactions({ ...transactionsFilter, page, pageSize: 20, sort, dir }),
  })

  const deletePayment = useMutation({
    mutationFn: (id: string) => financeApi.deletePayment(id),
    onSuccess: () => {
      showToast('Приход удалён')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'finance'] })
      setDeleting(null)
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось удалить приход', error), 'error'),
  })
  const deleteExpense = useMutation({
    mutationFn: (id: string) => financeApi.deleteExpense(id),
    onSuccess: () => {
      showToast('Расход удалён')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'finance'] })
      setDeleting(null)
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось удалить расход', error), 'error'),
  })

  async function handleExport() {
    if (exporting) return
    setExporting(true)
    try {
      const blob = await financeApi.exportXlsx(transactionsFilter)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `finance-${period.fromDate}-${period.toDate}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      showToast(adminErrorMessage('Не удалось экспортировать журнал', error), 'error')
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<FinanceTransaction>[] = [
    { key: 'date', header: 'Дата', sortable: true, render: (t) => new Date(t.date).toLocaleDateString('ru') },
    {
      key: 'type',
      header: 'Тип',
      render: (t) => <Badge tone={t.type === 'Income' ? 'success' : 'warning'}>{t.type === 'Income' ? 'Приход' : 'Расход'}</Badge>,
    },
    {
      key: 'amount',
      header: 'Сумма',
      sortable: true,
      render: (t) => (
        <span className={cn('font-semibold', t.type === 'Income' ? 'text-success' : 'text-warning')}>
          {t.type === 'Income' ? '+' : '−'} {formatMoney(t.amount)}
        </span>
      ),
    },
    { key: 'category', header: 'Категория / способ', render: (t) => categoryOrMethodLabel(t.type, t.categoryOrMethod) },
    { key: 'label', header: 'Рейс / направление', render: (t) => <span className="text-slate">{t.label ?? '—'}</span> },
    { key: 'client', header: 'Клиент', render: (t) => t.clientName ?? '—' },
    { key: 'comment', header: 'Комментарий', render: (t) => <span className="text-slate">{t.comment ?? '—'}</span> },
    { key: 'author', header: 'Кто добавил', render: (t) => <span className="text-slate">{t.createdByAdminDisplayName ?? '—'}</span> },
    {
      key: 'actions',
      header: '',
      render: (t) => (
        <IconActionButton label="Удалить" tone="danger" onClick={() => setDeleting(t)}>
          <Trash2 size={16} />
        </IconActionButton>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Финансы"
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setAddExpenseOpen(true)}>
              <Plus size={15} /> Расход
            </Button>
            <Button size="sm" onClick={() => setAddPaymentOpen(true)}>
              <Plus size={15} /> Приход
            </Button>
          </div>
        }
      />

      <div className="mb-6">
        <PeriodFilter period={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.isPending && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        {summary.isError && <ErrorState onRetry={() => summary.refetch()} />}
        {summary.isSuccess && (
          <>
            <KpiCard icon={TrendingUp} label="Приход за период" value={formatMoney(summary.data.incomeForPeriod)} tone="bg-success/10 text-success" />
            <KpiCard icon={TrendingDown} label="Расход за период" value={formatMoney(summary.data.expenseForPeriod)} tone="bg-warning/10 text-warning" />
            <KpiCard icon={Wallet} label="Баланс" value={formatMoney(summary.data.balanceAllTime)} tone="bg-brand/10 text-brand" />
            <KpiCard icon={AlertCircle} label="Дебиторская задолженность" value={formatMoney(summary.data.totalReceivables)} tone="bg-danger/10 text-danger" />
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate">Доходы и расходы по месяцам</h2>
          {monthlySeries.isPending && <Skeleton className="h-56 w-full" />}
          {monthlySeries.isError && <ErrorState onRetry={() => monthlySeries.refetch()} />}
          {monthlySeries.isSuccess && <FinanceChart points={monthlySeries.data} />}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate">Отчёт по рейсам / направлениям</h2>
          {flightReport.isPending && <Skeleton className="h-56 w-full" />}
          {flightReport.isError && <ErrorState onRetry={() => flightReport.refetch()} />}
          {flightReport.isSuccess && flightReport.data.length === 0 && <EmptyState title="Нет данных за период" />}
          {flightReport.isSuccess && flightReport.data.length > 0 && (
            <div className="space-y-3">
              {flightReport.data.slice(0, 8).map((item) => {
                const max = flightReport.data[0]?.total || 1
                return (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="truncate pr-2">{item.label}</span>
                      <span className="shrink-0 font-medium text-success">{formatMoney(item.total)}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-text/8">
                      <div className="h-full rounded-full bg-success" style={{ width: `${Math.max(4, (item.total / max) * 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate">Дебиторская задолженность</h2>
        {receivables.isPending && <Skeleton className="h-32 w-full" />}
        {receivables.isError && <ErrorState onRetry={() => receivables.refetch()} />}
        {receivables.isSuccess && receivables.data.items.length === 0 && <EmptyState title="Задолженностей нет — все заявки оплачены полностью" />}
        {receivables.isSuccess && receivables.data.items.length > 0 && (
          <DataTable
            columns={[
              { key: 'clientName', header: 'Клиент', render: (r) => r.clientName },
              { key: 'dealValue', header: 'Сумма сделки', render: (r) => formatMoney(r.dealValue) },
              { key: 'paid', header: 'Оплачено', render: (r) => <span className="text-success">{formatMoney(r.paid)}</span> },
              { key: 'remaining', header: 'Остаток к доплате', render: (r) => <span className="font-semibold text-danger">{formatMoney(r.remaining)}</span> },
            ]}
            rows={receivables.data.items}
            rowKey={(r) => r.travelRequestId}
          />
        )}
      </Card>

      <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate">Журнал транзакций</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-text/10 bg-elevated p-1">
            {([['all', 'Все'], ['Income', 'Приход'], ['Expense', 'Расход']] as [TypeFilter, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setTypeFilter(key); setPage(1) }}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm transition-colors',
                  typeFilter === key ? 'bg-brand text-white' : 'text-slate hover:bg-brand-subtle hover:text-brand',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Button size="sm" variant="excel" onClick={handleExport} disabled={exporting}>
            <ExcelIcon size={14} /> {exporting ? 'Excel…' : 'Excel'}
          </Button>
        </div>
      </div>

      {transactions.isPending && <Skeleton className="h-40 w-full" />}
      {transactions.isError && <ErrorState onRetry={() => transactions.refetch()} />}
      {transactions.isSuccess && transactions.data.items.length === 0 && <EmptyState title="Операций за период нет" />}
      {transactions.isSuccess && transactions.data.items.length > 0 && (
        <>
          <DataTable columns={columns} rows={transactions.data.items} rowKey={(t) => t.id} sort={sort} dir={dir} onSort={toggleSort} />
          <Pagination page={transactions.data.page} totalPages={transactions.data.totalPages} onChange={setPage} />
        </>
      )}

      <AddPaymentModal open={addPaymentOpen} onClose={() => setAddPaymentOpen(false)} onCreated={() => setAddPaymentOpen(false)} />
      <AddExpenseModal open={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} onCreated={() => setAddExpenseOpen(false)} />

      <DeleteConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          if (deleting.type === 'Income') deletePayment.mutate(deleting.id)
          else deleteExpense.mutate(deleting.id)
        }}
        isPending={deletePayment.isPending || deleteExpense.isPending}
        title={deleting?.type === 'Income' ? 'Удалить приход?' : 'Удалить расход?'}
        description="Операция будет удалена из журнала без возможности восстановления."
      />
    </div>
  )
}
