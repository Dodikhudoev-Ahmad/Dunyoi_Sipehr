import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, UserCheck } from 'lucide-react'
import { travelRequestsApi } from '@/api/travelRequests'
import { flightsApi } from '@/api/flights'
import type { TravelRequest } from '@/types/domain'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldLabel, Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { adminErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/cn'

type Mode = 'from-request' | 'manual'

function fullNameOf(r: TravelRequest): string {
  return [r.lastName, r.firstName, r.middleName].filter(Boolean).join(' ')
}

/** "Из заявки" tab — a type-to-search list over existing TravelRequests (reuses the same admin
 * list endpoint/search param the requests list page uses) rather than a plain dropdown, since the
 * CRM can hold thousands of requests. Debounced by 300ms so every keystroke doesn't fire a request. */
function FromRequestSearch({ onSelect }: { onSelect: (r: TravelRequest) => void }) {
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 300)
    return () => clearTimeout(timer)
  }, [term])

  const results = useQuery({
    queryKey: ['admin', 'travel-requests', 'search', debounced],
    queryFn: () => travelRequestsApi.adminList({ page: 1, pageSize: 10, search: debounced }),
    enabled: debounced.length >= 2,
  })

  return (
    <div>
      <FieldLabel htmlFor="passenger-search">Поиск по заявке</FieldLabel>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate" />
        <Input
          id="passenger-search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ФИО или телефон клиента…"
          className="pl-9"
        />
      </div>
      {debounced.length < 2 && <p className="mt-2 text-xs text-slate">Введите минимум 2 символа</p>}
      {results.isPending && debounced.length >= 2 && <Skeleton className="mt-2 h-24 w-full" />}
      {results.isSuccess && results.data.items.length === 0 && <p className="mt-2 text-xs text-slate">Ничего не найдено</p>}
      {results.isSuccess && results.data.items.length > 0 && (
        <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto">
          {results.data.items.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onSelect(r)}
                className="flex w-full flex-col rounded-lg border border-text/10 px-3 py-2 text-left text-sm hover:border-brand hover:bg-brand-subtle"
              >
                <span className="font-medium">{fullNameOf(r)}</span>
                <span className="text-xs text-slate">{r.phone} · заявка от {new Date(r.createdAtUtc).toLocaleDateString('ru')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function AddPassengerModal({ open, onClose, flightId }: { open: boolean; onClose: () => void; flightId: string }) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<Mode>('from-request')
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  function reset() {
    setMode('from-request')
    setSelectedRequest(null)
    setFullName('')
    setPhone('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'flight-passengers', flightId] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'flights'] })
  }

  const addFromRequest = useMutation({
    mutationFn: () => flightsApi.adminAddPassengerFromRequest(flightId, { travelRequestId: selectedRequest!.id, fullName, phone }),
    onSuccess: () => {
      showToast('Участник добавлен')
      invalidate()
      handleClose()
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось добавить участника', error), 'error'),
  })

  const addManual = useMutation({
    mutationFn: () => flightsApi.adminAddManualPassenger(flightId, { fullName, phone }),
    onSuccess: () => {
      showToast('Участник добавлен')
      invalidate()
      handleClose()
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось добавить участника', error), 'error'),
  })

  const isPending = addFromRequest.isPending || addManual.isPending
  const canSubmit =
    fullName.trim().length > 0 && phone.trim().length > 0 && (mode === 'manual' || selectedRequest !== null)

  function handleSubmit() {
    if (!canSubmit) return
    if (mode === 'from-request') addFromRequest.mutate()
    else addManual.mutate()
  }

  return (
    <Modal open={open} onClose={handleClose} label="Добавить участника" title="Добавить участника">
      <div className="mb-4 flex gap-1 rounded-lg bg-text/5 p-1">
        {(['from-request', 'manual'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setSelectedRequest(null); setFullName(''); setPhone('') }}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              mode === m ? 'bg-elevated text-text shadow-sm' : 'text-slate hover:text-text',
            )}
          >
            {m === 'from-request' ? 'Из заявки' : 'Вручную'}
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
        {mode === 'from-request' && !selectedRequest && <FromRequestSearch onSelect={(r) => { setSelectedRequest(r); setFullName(fullNameOf(r)); setPhone(r.phone) }} />}

        {mode === 'from-request' && selectedRequest && (
          <div className="flex items-center gap-2 rounded-lg border border-brand/30 bg-brand-subtle px-3 py-2 text-sm text-brand">
            <UserCheck size={15} className="shrink-0" />
            <span className="flex-1">Выбрано: {fullNameOf(selectedRequest)}</span>
            <button type="button" className="font-medium underline underline-offset-2" onClick={() => setSelectedRequest(null)}>
              Изменить
            </button>
          </div>
        )}

        {(mode === 'manual' || selectedRequest) && (
          <>
            <div>
              <FieldLabel htmlFor="passenger-name">ФИО</FieldLabel>
              <Input id="passenger-name" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isPending} />
            </div>
            <div>
              <FieldLabel htmlFor="passenger-phone">Телефон</FieldLabel>
              <Input id="passenger-phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isPending} />
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
            Отмена
          </Button>
          <Button type="submit" disabled={!canSubmit || isPending}>
            {isPending ? 'Добавление…' : 'Добавить'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
