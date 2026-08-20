import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ConfirmDeleteButton({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <Button size="sm" variant="secondary" className="border-danger text-danger" disabled={disabled} onClick={onConfirm}>
          Подтвердить
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          Отмена
        </Button>
      </span>
    )
  }

  return (
    <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => setConfirming(true)} aria-label="Delete">
      <Trash2 size={15} />
    </Button>
  )
}
