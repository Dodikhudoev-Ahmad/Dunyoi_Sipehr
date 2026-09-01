import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { flightsApi } from '@/api/flights'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldLabel } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { adminErrorMessage } from '@/lib/apiError'

interface TransferPassengerModalProps {
  open: boolean
  onClose: () => void
  passengerId: string
  currentFlightId: string
  /** Called after a successful transfer — caller invalidates/refetches whatever list this
   * passenger just left (they no longer belong on it) and closes the passenger card too. */
  onTransferred: () => void
}

/** SuperAdmin-only "move to another flight" modal — target list excludes the passenger's current
 * flight so it's not possible to "transfer" them onto the same one they're already on. */
export function TransferPassengerModal({ open, onClose, passengerId, currentFlightId, onTransferred }: TransferPassengerModalProps) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [targetFlightId, setTargetFlightId] = useState('')

  const flights = useQuery({
    queryKey: ['admin', 'flights', 'all-for-transfer'],
    queryFn: () => flightsApi.adminList({ page: 1, pageSize: 100, sort: 'departureAtUtc', dir: 'desc' }),
    enabled: open,
  })

  const targetOptions = flights.data?.items.filter((f) => f.id !== currentFlightId) ?? []

  function reset() {
    setTargetFlightId('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  const transfer = useMutation({
    mutationFn: () => flightsApi.adminTransferPassenger({ passengerId, targetFlightId }),
    onSuccess: () => {
      showToast('Пассажир перенесён на другой рейс')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'flight-passengers'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'passengers'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'flights'] })
      reset()
      onTransferred()
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось перенести пассажира', error), 'error'),
  })

  return (
    <Modal open={open} onClose={handleClose} label="Перенести на другой рейс" title="Перенести на другой рейс">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (targetFlightId && !transfer.isPending) transfer.mutate()
        }}
      >
        <div>
          <FieldLabel htmlFor="transfer-target-flight">Новый рейс</FieldLabel>
          {flights.isPending ? (
            <Skeleton className="h-11 w-full" />
          ) : (
            <Select
              id="transfer-target-flight"
              value={targetFlightId}
              onChange={(e) => setTargetFlightId(e.target.value)}
              disabled={transfer.isPending}
              placeholder="Выберите рейс"
            >
              {targetOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.flightNumber} — {f.originCity} → {f.destinationCity} — {new Date(f.departureAtUtc).toLocaleString('ru')}
                </option>
              ))}
            </Select>
          )}
          {flights.isSuccess && targetOptions.length === 0 && (
            <p className="mt-1.5 text-xs text-slate">Других рейсов пока нет — создайте ещё один, чтобы перенести пассажира.</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={transfer.isPending}>
            Отмена
          </Button>
          <Button type="submit" disabled={!targetFlightId || transfer.isPending}>
            {transfer.isPending ? 'Перенос…' : 'Перенести'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
