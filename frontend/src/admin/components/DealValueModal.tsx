import { useState } from 'react'
import type { Currency } from '@/types/domain'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldLabel, Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

/**
 * Shared by CrmBoardPage (drag-to-Won) and TravelRequestDetailPage (status-button click) — both
 * are ways to move a request to Won, and the business rule ("no closing a deal without a
 * recorded value") has to hold regardless of which UI the operator used, not just the Kanban
 * drag gesture specifically.
 */
export function DealValueModal({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (value: number, currency: Currency) => void
  isPending?: boolean
}) {
  const [value, setValue] = useState('')
  const [currency, setCurrency] = useState<Currency>('USD')

  const numericValue = parseFloat(value)
  const canSubmit = value.trim().length > 0 && Number.isFinite(numericValue) && numericValue > 0

  function handleClose() {
    setValue('')
    setCurrency('USD')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} label="Сумма сделки" title="Укажите сумму сделки">
      <p className="mb-4 text-sm text-slate">
        Прежде чем перевести заявку в статус «Успех», нужно зафиксировать сумму сделки.
      </p>
      <div className="flex gap-3">
        <div className="flex-1">
          <FieldLabel htmlFor="deal-value">Сумма</FieldLabel>
          <Input
            id="deal-value"
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isPending}
            autoFocus
          />
        </div>
        <div className="w-28">
          <FieldLabel htmlFor="deal-currency">Валюта</FieldLabel>
          <Select id="deal-currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} disabled={isPending}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="TJS">TJS</option>
          </Select>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
          Отмена
        </Button>
        <Button
          type="button"
          onClick={() => canSubmit && onConfirm(numericValue, currency)}
          disabled={!canSubmit || isPending}
        >
          {isPending ? 'Сохранение…' : 'Сохранить и завершить'}
        </Button>
      </div>
    </Modal>
  )
}
