import { useState } from 'react'
import { Trash2, Check, X } from 'lucide-react'
import { IconActionButton } from '@/components/ui/IconActionButton'

export function ConfirmDeleteButton({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <IconActionButton label="Подтвердить удаление" tone="danger" disabled={disabled} onClick={onConfirm}>
          <Check size={16} />
        </IconActionButton>
        <IconActionButton label="Отмена" onClick={() => setConfirming(false)}>
          <X size={16} />
        </IconActionButton>
      </span>
    )
  }

  return (
    <IconActionButton label="Удалить" tone="danger" onClick={() => setConfirming(true)}>
      <Trash2 size={16} />
    </IconActionButton>
  )
}
