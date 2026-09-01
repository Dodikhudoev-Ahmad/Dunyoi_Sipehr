import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ArrowRightLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { FlightPassengerSource } from '@/types/domain'
import { TransferPassengerModal } from '@/admin/components/TransferPassengerModal'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

/** Common shape both FlightPassenger (scoped to one flight) and PassengerRegistryItem
 * (cross-flight registry row) satisfy — this card is used as the drill-down "full card" from
 * either list, on data both already have loaded, so opening it never fires a new GET. */
export interface PassengerCardData {
  id: string
  flightId: string
  fullName: string
  phone: string
  source: FlightPassengerSource
  travelRequestId: string | null
  addedByAdminDisplayName: string | null
  addedAtUtc: string
}

export function PassengerCardModal({
  passenger,
  flightLabel,
  onClose,
  onTransferred,
}: {
  passenger: PassengerCardData | null
  /** e.g. "FZ777 — Душанбе → Дубай" — the caller already has this in scope either way
   * (FlightDetailPage's own flight, or the row's own flightNumber in the registry). */
  flightLabel: string
  onClose: () => void
  onTransferred: () => void
}) {
  const { admin } = useAuth()
  const isSuperAdmin = admin?.role === 'SuperAdmin'
  const [transferOpen, setTransferOpen] = useState(false)

  return (
    <>
      <Modal open={passenger !== null} onClose={onClose} label="Карточка пассажира" title="Карточка пассажира">
        {passenger && (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-slate">ФИО</dt>
                <dd className="text-base font-medium">{passenger.fullName}</dd>
              </div>
              <div>
                <dt className="text-slate">Телефон</dt>
                <dd className="font-medium">{passenger.phone}</dd>
              </div>
              <div>
                <dt className="text-slate">Источник</dt>
                <dd>
                  <Badge tone={passenger.source === 'Crm' ? 'brand' : 'neutral'}>{passenger.source === 'Crm' ? 'CRM' : 'Вручную'}</Badge>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate">Рейс</dt>
                <dd className="font-medium">{flightLabel}</dd>
              </div>
              {passenger.travelRequestId && (
                <div className="sm:col-span-2">
                  <dt className="text-slate">Заявка в CRM</dt>
                  <dd>
                    <NavLink to={`/admin/travel-requests/${passenger.travelRequestId}`} className="font-medium text-brand hover:underline">
                      Открыть заявку →
                    </NavLink>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-slate">Кто добавил</dt>
                <dd className="font-medium">{passenger.addedByAdminDisplayName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate">Дата добавления</dt>
                <dd className="font-medium">{new Date(passenger.addedAtUtc).toLocaleString('ru')}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-text/8 pt-4">
              {isSuperAdmin ? (
                <Button variant="secondary" size="sm" onClick={() => setTransferOpen(true)}>
                  <ArrowRightLeft size={14} /> Перенести на другой рейс
                </Button>
              ) : (
                <span />
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                Закрыть
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {passenger && (
        <TransferPassengerModal
          open={transferOpen}
          onClose={() => setTransferOpen(false)}
          passengerId={passenger.id}
          currentFlightId={passenger.flightId}
          onTransferred={() => {
            setTransferOpen(false)
            onTransferred()
          }}
        />
      )}
    </>
  )
}
