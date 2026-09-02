import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

/**
 * The one confirm dialog for every destructive action across the admin — replaces an earlier
 * inline check/✕-swap pattern that used to live on each list row, since a generic "delete this
 * row?" doesn't say what's actually being removed. The description names it explicitly (e.g. a
 * passenger's full name, a destination's slug). Built on the same `Modal` primitive every other
 * dialog in the app already uses (Esc / click-outside close it, no action taken). Also reused for
 * non-delete-but-still-destructive actions (e.g. deactivating a staff account) via `confirmLabel`.
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
