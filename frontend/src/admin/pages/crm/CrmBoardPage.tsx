import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Phone, Plane, Users, ChevronLeft, ChevronRight, TrendingUp, Inbox, CheckCircle2, Percent, AlertTriangle } from 'lucide-react'
import { travelRequestsApi } from '@/api/travelRequests'
import type { Currency, TravelRequest, TravelRequestStatus } from '@/types/domain'
import { PageHeader } from '@/admin/components/PageHeader'
import { DealValueModal } from '@/admin/components/DealValueModal'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useToast } from '@/components/ui/Toast'
import { adminErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/cn'
import { STATUS_ORDER, STATUS_LABEL, STATUS_ACCENT, isFollowUpOverdue } from '@/admin/lib/requestStatus'

// Ключ кэша react-query для списка заявок на доске — выносим в одно место,
// чтобы и загрузка, и обновление статуса ссылались на один и тот же список.
const BOARD_KEY = ['admin', 'crm-board']

/** Одна KPI-карточка вверху страницы (например «Всего заявок»). */
function MetricCard({ icon: Icon, label, value, tone }: { icon: typeof Inbox; label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-text/8 bg-elevated/70 px-4 py-3.5 shadow-[0_1px_2px_rgba(11,15,20,0.04)]">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tone)}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-semibold leading-tight">{value}</p>
        <p className="truncate text-xs text-slate">{label}</p>
      </div>
    </div>
  )
}

/** Карточка одной заявки внутри колонки воронки. */
function RequestCard({
  request,
  onOpen,
  onMove,
  onDragStart,
  isBusy,
}: {
  request: TravelRequest
  onOpen: () => void
  onMove: (dir: -1 | 1) => void
  onDragStart: () => void
  isBusy: boolean
}) {
  const fullName = [request.lastName, request.firstName].filter(Boolean).join(' ')
  const destination = request.destinationSnapshotTitle ?? request.offerSnapshotTitle ?? '—'
  const passengers = (request.passengersAdults ?? 0) + (request.passengersChildren ?? 0)
  // Позиция статуса в воронке — нужна, чтобы отключить стрелку «назад» на первом
  // этапе и «вперёд» на последнем.
  const idx = STATUS_ORDER.indexOf(request.status)
  const overdue = isFollowUpOverdue(request)

  return (
    <div
      // draggable + onDragStart включают перетаскивание мышью на компьютере.
      draggable
      onDragStart={onDragStart}
      className={cn(
        'group rounded-xl border bg-paper p-3 shadow-[0_1px_2px_rgba(11,15,20,0.04)] transition-shadow hover:shadow-[0_6px_18px_rgba(11,15,20,0.10)]',
        overdue ? 'border-danger/40 bg-danger/5' : 'border-text/8',
        isBusy && 'pointer-events-none opacity-50',
      )}
    >
      <button onClick={onOpen} className="block w-full text-left">
        {overdue && (
          <p className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-danger">
            <AlertTriangle size={11} /> Просрочено напоминание
          </p>
        )}
        <p className="truncate text-sm font-medium">{fullName}</p>
        <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-slate">
          <Plane size={12} className="shrink-0" /> {destination}
        </p>
        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate">
          <Phone size={12} className="shrink-0" /> {request.phone}
        </p>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-slate">
          <span className="flex items-center gap-1">
            <Users size={11} /> {passengers}
          </span>
          <span>{new Date(request.createdAtUtc).toLocaleDateString('ru')}</span>
        </div>
        {request.dealValue != null && (
          <p className="mt-2 text-sm font-semibold text-success">
            {request.dealValue.toLocaleString('ru')} {request.dealCurrency}
          </p>
        )}
      </button>

      {/* Стрелки перемещения по воронке — основной способ на телефоне,
          где перетаскивание пальцем неудобно. */}
      <div className="mt-2.5 flex items-center justify-between border-t border-text/8 pt-2">
        <button
          onClick={() => onMove(-1)}
          disabled={idx === 0 || isBusy}
          aria-label="Предыдущий этап"
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate transition-colors hover:bg-brand-subtle hover:text-brand disabled:opacity-30"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          onClick={() => onMove(1)}
          disabled={idx === STATUS_ORDER.length - 1 || isBusy}
          aria-label="Следующий этап"
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate transition-colors hover:bg-brand-subtle hover:text-brand disabled:opacity-30"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

export function CrmBoardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  // Запоминаем, какую карточку тащим мышью, чтобы узнать её при «отпускании» на колонке.
  const [dragged, setDragged] = useState<TravelRequest | null>(null)
  // Заявка, которую пытаются перевести в «Успех» без указанной суммы сделки — пока ждём ввод в
  // модалке, сам статус ещё не меняется.
  const [pendingWonRequest, setPendingWonRequest] = useState<TravelRequest | null>(null)

  // Грузим все заявки одним запросом (до 100) и раскладываем по колонкам на клиенте.
  const board = useQuery({
    queryKey: BOARD_KEY,
    queryFn: () => travelRequestsApi.adminList({ page: 1, pageSize: 100, sort: 'createdAtUtc', dir: 'desc' }),
  })

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TravelRequestStatus }) =>
      travelRequestsApi.adminSetStatus(id, status),
    // Оптимистичное обновление: карточка перескакивает в новую колонку сразу,
    // не дожидаясь ответа сервера (важно — бэкенд на бесплатном тарифе бывает медленным).
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: BOARD_KEY })
      const prev = queryClient.getQueryData(BOARD_KEY)
      queryClient.setQueryData(BOARD_KEY, (old: typeof board.data | undefined) =>
        old ? { ...old, items: old.items.map((r) => (r.id === id ? { ...r, status } : r)) } : old,
      )
      return { prev } // сохраняем прежнее состояние на случай ошибки
    },
    onError: (error, _vars, ctx) => {
      // Не удалось — откатываем карточку обратно.
      if (ctx?.prev) queryClient.setQueryData(BOARD_KEY, ctx.prev)
      showToast(adminErrorMessage('Не удалось обновить статус', error), 'error')
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: BOARD_KEY }),
  })

  const setDealValue = useMutation({
    mutationFn: ({ id, value, currency }: { id: string; value: number; currency: Currency }) =>
      travelRequestsApi.adminUpdateDealValue(id, value, currency),
    onError: (error) => showToast(adminErrorMessage('Не удалось сохранить сумму сделки', error), 'error'),
  })

  if (board.isPending) return <Skeleton className="h-96 w-full" />
  if (board.isError) return <ErrorState onRetry={() => board.refetch()} />

  const items = board.data.items

  // Считаем метрики воронки для верхних KPI-карточек.
  const total = items.length
  const inProgress = items.filter((r) => r.status === 'New' || r.status === 'Contacted' || r.status === 'Qualified').length
  const won = items.filter((r) => r.status === 'Won').length
  const lost = items.filter((r) => r.status === 'Lost').length
  // Конверсия = доля успешных среди всех закрытых (успех + отказ).
  const closed = won + lost
  const conversion = closed > 0 ? Math.round((won / closed) * 100) : 0

  // Единая точка входа для любого перехода статуса на доске (стрелки и drag-n-drop оба идут
  // через неё) — так бизнес-правило «нет суммы сделки — нет перехода в Успех» не обходится ни
  // одним из двух способов взаимодействия.
  const changeStatus = (request: TravelRequest, status: TravelRequestStatus) => {
    if (status === 'Won' && request.dealValue == null) {
      setPendingWonRequest(request)
      return
    }
    setStatus.mutate({ id: request.id, status })
  }

  // Перемещение карточки на N этапов вперёд/назад по массиву STATUS_ORDER.
  const move = (request: TravelRequest, dir: -1 | 1) => {
    const next = STATUS_ORDER[STATUS_ORDER.indexOf(request.status) + dir]
    if (next) changeStatus(request, next)
  }

  // Отпустили карточку на колонку: если статус реально меняется — сохраняем.
  const drop = (status: TravelRequestStatus) => {
    if (dragged && dragged.status !== status) changeStatus(dragged, status)
    setDragged(null)
  }

  return (
    <div>
      <PageHeader title="CRM — воронка заявок" />

      {/* KPI-метрики: 2 колонки на телефоне, 4 на компьютере. */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon={Inbox} label="Всего заявок" value={String(total)} tone="bg-brand/10 text-brand" />
        <MetricCard icon={TrendingUp} label="В работе" value={String(inProgress)} tone="bg-warning/10 text-warning" />
        <MetricCard icon={CheckCircle2} label="Успешных" value={String(won)} tone="bg-success/10 text-success" />
        <MetricCard icon={Percent} label="Конверсия" value={`${conversion}%`} tone="bg-brand-accent/20 text-brand-hover" />
      </div>

      {/* Доска: колонки в ряд с горизонтальной прокруткой на узких экранах. */}
      <div className="-mx-5 overflow-x-auto px-5 pb-4 md:mx-0 md:px-0">
        <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
          {STATUS_ORDER.map((status) => {
            const cards = items.filter((r) => r.status === status)
            return (
              <div
                key={status}
                // onDragOver с preventDefault разрешает «бросить» сюда карточку.
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => drop(status)}
                className="flex w-72 shrink-0 flex-col rounded-2xl border border-text/8 bg-elevated/40"
              >
                {/* Шапка колонки: цветная точка + название этапа + счётчик. */}
                <div className="flex items-center gap-2 px-3.5 py-3">
                  <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_ACCENT[status])} />
                  <span className="text-sm font-medium">{STATUS_LABEL[status]}</span>
                  <span className="ml-auto rounded-full bg-text/5 px-2 py-0.5 text-xs text-slate">{cards.length}</span>
                </div>

                <div className="flex flex-1 flex-col gap-2.5 px-2.5 pb-3">
                  {cards.length === 0 ? (
                    <p className="px-1 py-6 text-center text-xs text-slate/60">Пусто</p>
                  ) : (
                    cards.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        isBusy={setStatus.isPending && setStatus.variables?.id === request.id}
                        onOpen={() => navigate(`/admin/travel-requests/${request.id}`)}
                        onMove={(dir) => move(request, dir)}
                        onDragStart={() => setDragged(request)}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <DealValueModal
        open={pendingWonRequest !== null}
        onClose={() => setPendingWonRequest(null)}
        isPending={setDealValue.isPending || setStatus.isPending}
        onConfirm={(value, currency) => {
          if (!pendingWonRequest) return
          const id = pendingWonRequest.id
          setDealValue.mutate(
            { id, value, currency },
            {
              onSuccess: () => {
                setStatus.mutate(
                  { id, status: 'Won' },
                  {
                    onSuccess: () => {
                      showToast('Сделка закрыта успешно')
                      setPendingWonRequest(null)
                    },
                  },
                )
              },
            },
          )
        }}
      />
    </div>
  )
}
