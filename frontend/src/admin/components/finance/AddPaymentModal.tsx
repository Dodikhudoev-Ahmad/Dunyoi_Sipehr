import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { financeApi } from '@/api/finance'
import type { PaymentMethod } from '@/types/domain'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldLabel, FieldError, Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { adminErrorMessage } from '@/lib/apiError'
import { PAYMENT_METHOD_LABEL } from '@/admin/lib/financeLabels'

/** Long-form ru date for the read-only "today" display below — e.g. "5 сентября 2026". */
function todayLabel(): string {
  return new Date().toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
}

const READONLY_FIELD_CLASSES = 'flex min-h-11 items-center rounded-lg border border-text/15 bg-text/5 px-4 text-sm text-slate'

export function AddPaymentModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [amount, setAmount] = useState('')
  const [clientName, setClientName] = useState('')
  const [travelRequestId, setTravelRequestId] = useState('')
  const [flightId, setFlightId] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('Cash')
  const [comment, setComment] = useState('')
  const [search, setSearch] = useState('')

  const requests = useQuery({
    queryKey: ['admin', 'finance', 'requests-lookup', search],
    queryFn: () => financeApi.travelRequestsLookup(search || undefined),
    enabled: open,
  })

  // Scopes the flight dropdown to only the flights this specific client is actually on the
  // manifest for — never the whole flight catalog (see backend GetFinanceFlightsForClientQuery
  // and the security fix it addresses: a payment used to be linkable to any flight regardless of
  // who was actually on it).
  const clientKey = travelRequestId || clientName.trim()
  const flightsForClient = useQuery({
    queryKey: ['admin', 'finance', 'flights-for-client', travelRequestId || null, travelRequestId ? null : clientName.trim()],
    queryFn: () => financeApi.flightsForClient(travelRequestId ? { travelRequestId } : { clientName: clientName.trim() }),
    enabled: open && clientKey.length > 1,
  })

  // A new/changed client invalidates whatever flight was picked for the previous one.
  useEffect(() => {
    setFlightId('')
  }, [clientKey])

  // Exactly one flight for this client — no need to make the accountant pick it themselves.
  const onlyClientFlight = flightsForClient.data?.length === 1 ? flightsForClient.data[0] : undefined
  useEffect(() => {
    if (onlyClientFlight) setFlightId(onlyClientFlight.id)
  }, [onlyClientFlight])

  function reset() {
    setAmount('')
    setClientName('')
    setTravelRequestId('')
    setFlightId('')
    setMethod('Cash')
    setComment('')
    setSearch('')
  }

  const create = useMutation({
    mutationFn: () =>
      financeApi.createPayment({
        amount: Number(amount),
        clientName: clientName.trim(),
        travelRequestId: travelRequestId || undefined,
        flightId: flightId || undefined,
        method,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      showToast('Приход добавлен')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'finance'] })
      reset()
      onCreated()
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось добавить приход', error), 'error'),
  })

  const canSubmit = Number(amount) > 0 && clientName.trim().length > 0

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); reset() }}
      label="Новый приход"
      title="Новый приход"
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (canSubmit) create.mutate()
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="payment-amount">Сумма (TJS)</FieldLabel>
            <Input id="payment-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={create.isPending} />
          </div>
          <div>
            <FieldLabel>Дата</FieldLabel>
            {/* Always today's server date — not editable, so an operation can't be backdated to
                manipulate the balance or period reports (see backend UpsertPaymentInput). */}
            <p className={READONLY_FIELD_CLASSES}>{todayLabel()}</p>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="payment-client">Клиент</FieldLabel>
          <Input
            id="payment-client"
            value={clientName}
            onChange={(e) => {
              setClientName(e.target.value)
              setSearch(e.target.value)
              if (travelRequestId) setTravelRequestId('')
            }}
            placeholder="ФИО клиента"
            disabled={create.isPending}
          />
          {search.trim().length > 1 && requests.data && requests.data.length > 0 && !travelRequestId && (
            <div className="mt-1.5 max-h-36 overflow-y-auto rounded-lg border border-text/10 bg-elevated">
              {requests.data.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => { setClientName(r.clientName); setTravelRequestId(r.id); setSearch('') }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-brand-subtle hover:text-brand"
                >
                  <span className="truncate">{r.clientName} · {r.phone}</span>
                  {r.dealValue != null && <span className="shrink-0 text-xs text-slate">{r.dealValue.toLocaleString('ru')}</span>}
                </button>
              ))}
            </div>
          )}
          {travelRequestId && (
            <p className="mt-1 flex items-center justify-between text-xs text-slate">
              Связано с заявкой CRM
              <button type="button" className="text-brand hover:underline" onClick={() => setTravelRequestId('')}>Отвязать</button>
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="payment-flight">Рейс (опционально)</FieldLabel>
            {clientKey.length <= 1 ? (
              <p className={READONLY_FIELD_CLASSES}>Сначала укажите клиента</p>
            ) : flightsForClient.isPending ? (
              <Skeleton className="h-11 w-full" />
            ) : flightsForClient.data && flightsForClient.data.length === 0 ? (
              <p className={READONLY_FIELD_CLASSES}>Нет рейсов для этого клиента</p>
            ) : (
              <Select id="payment-flight" value={flightId} onChange={(e) => setFlightId(e.target.value)} disabled={create.isPending}>
                <option value="">Не указан</option>
                {flightsForClient.data?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.flightNumber} — {new Date(f.departureAtUtc).toLocaleDateString('ru')}
                  </option>
                ))}
              </Select>
            )}
          </div>
          <div>
            <FieldLabel htmlFor="payment-method">Способ оплаты</FieldLabel>
            <Select id="payment-method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} disabled={create.isPending}>
              {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((m) => (
                <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="payment-comment">Комментарий</FieldLabel>
          <Input id="payment-comment" value={comment} onChange={(e) => setComment(e.target.value)} disabled={create.isPending} />
          <FieldError>{comment.length > 500 ? 'Максимум 500 символов' : undefined}</FieldError>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => { onClose(); reset() }} disabled={create.isPending}>Отмена</Button>
          <Button type="submit" disabled={!canSubmit || create.isPending}>{create.isPending ? 'Добавление…' : 'Добавить'}</Button>
        </div>
      </form>
    </Modal>
  )
}
