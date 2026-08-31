import { useEffect, useState } from 'react'
import type { Flight, FlightDetail, FlightStatus } from '@/types/domain'
import type { UpsertFlightPayload } from '@/api/flights'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldLabel, Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { FLIGHT_STATUS_ORDER, FLIGHT_STATUS_LABEL } from '@/admin/lib/flightStatus'

/** Local <input type="datetime-local"> representation (no timezone suffix) of an ISO instant —
 * `new Date(iso)` already resolves to the viewer's local time, we just need to format it the way
 * the input expects; the reverse (`new Date(value).toISOString()`) round-trips correctly because
 * the browser parses an unsuffixed datetime-local string as local time too. */
function toLocalInputValue(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface FlightFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: UpsertFlightPayload) => void
  isPending?: boolean
  /** Present when editing an existing flight; absent for "Добавить рейс". */
  flight?: Flight | FlightDetail
}

export function FlightFormModal({ open, onClose, onSubmit, isPending, flight }: FlightFormModalProps) {
  const [flightNumber, setFlightNumber] = useState('')
  const [originCity, setOriginCity] = useState('')
  const [destinationCity, setDestinationCity] = useState('')
  const [departureAt, setDepartureAt] = useState('')
  const [status, setStatus] = useState<FlightStatus>('Scheduled')

  useEffect(() => {
    if (!open) return
    setFlightNumber(flight?.flightNumber ?? '')
    setOriginCity(flight?.originCity ?? '')
    setDestinationCity(flight?.destinationCity ?? '')
    setDepartureAt(flight ? toLocalInputValue(flight.departureAtUtc) : '')
    setStatus(flight?.status ?? 'Scheduled')
  }, [open, flight])

  const canSubmit = flightNumber.trim().length > 0 && originCity.trim().length > 0 && destinationCity.trim().length > 0 && departureAt.length > 0

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit({
      flightNumber: flightNumber.trim(),
      originCity: originCity.trim(),
      destinationCity: destinationCity.trim(),
      departureAtUtc: new Date(departureAt).toISOString(),
      status,
    })
  }

  return (
    <Modal open={open} onClose={onClose} label={flight ? 'Изменить рейс' : 'Добавить рейс'} title={flight ? 'Изменить рейс' : 'Добавить рейс'}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
        <div>
          <FieldLabel htmlFor="flight-number">Номер рейса</FieldLabel>
          <Input id="flight-number" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} disabled={isPending} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="flight-origin">Откуда</FieldLabel>
            <Input id="flight-origin" value={originCity} onChange={(e) => setOriginCity(e.target.value)} disabled={isPending} />
          </div>
          <div>
            <FieldLabel htmlFor="flight-destination">Куда</FieldLabel>
            <Input id="flight-destination" value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} disabled={isPending} />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="flight-departure">Дата и время вылета</FieldLabel>
          <Input id="flight-departure" type="datetime-local" value={departureAt} onChange={(e) => setDepartureAt(e.target.value)} disabled={isPending} />
        </div>
        {flight && (
          <div>
            <FieldLabel htmlFor="flight-status">Статус</FieldLabel>
            <Select id="flight-status" value={status} onChange={(e) => setStatus(e.target.value as FlightStatus)} disabled={isPending}>
              {FLIGHT_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {FLIGHT_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Отмена
          </Button>
          <Button type="submit" disabled={!canSubmit || isPending}>
            {isPending ? 'Сохранение…' : flight ? 'Сохранить' : 'Добавить'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
