import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

/**
 * A full modal confirm for destructive actions that deserve more weight than the inline
 * check/✕-swap `ConfirmDeleteButton` pattern used for simple list-row deletes elsewhere in the
 * admin — e.g. removing a passenger from a flight, where the description names exactly who's
 * being removed rather than a generic "delete this row?". Built on the same `Modal` primitive
 * every other dialog in the app already uses (Esc / click-outside close it, no action taken).
 */
export function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  isPending,
  title,
  description,
  confirmLabel = 'Удалить',
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isPending?: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
}) {
  return (
    <Modal open={open} onClose={onClose} label={title} title={title}>
      <p className="text-sm text-slate">{description}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
          Отмена
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} disabled={isPending}>
          {isPending ? 'Удаление…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
