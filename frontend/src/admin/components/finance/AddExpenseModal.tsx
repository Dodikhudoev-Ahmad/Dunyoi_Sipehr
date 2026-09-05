import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { financeApi } from '@/api/finance'
import type { ExpenseCategory } from '@/types/domain'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldLabel, FieldError, Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { adminErrorMessage } from '@/lib/apiError'
import { EXPENSE_CATEGORY_LABEL } from '@/admin/lib/financeLabels'

/** Long-form ru date for the read-only "today" display below — e.g. "5 сентября 2026". */
function todayLabel(): string {
  return new Date().toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function AddExpenseModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Rent')
  const [comment, setComment] = useState('')

  function reset() {
    setAmount('')
    setCategory('Rent')
    setComment('')
  }

  const create = useMutation({
    mutationFn: () => financeApi.createExpense({ amount: Number(amount), category, comment: comment.trim() || undefined }),
    onSuccess: () => {
      showToast('Расход добавлен')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'finance'] })
      reset()
      onCreated()
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось добавить расход', error), 'error'),
  })

  const canSubmit = Number(amount) > 0

  return (
    <Modal open={open} onClose={() => { onClose(); reset() }} label="Новый расход" title="Новый расход">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (canSubmit) create.mutate()
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="expense-amount">Сумма (TJS)</FieldLabel>
            <Input id="expense-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={create.isPending} />
          </div>
          <div>
            <FieldLabel>Дата</FieldLabel>
            {/* Always today's server date — not editable, so an operation can't be backdated to
                manipulate the balance or period reports (see backend UpsertExpenseInput). */}
            <p className="flex min-h-11 items-center rounded-lg border border-text/15 bg-text/5 px-4 text-slate">{todayLabel()}</p>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="expense-category">Категория</FieldLabel>
          <Select id="expense-category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} disabled={create.isPending}>
            {(Object.keys(EXPENSE_CATEGORY_LABEL) as ExpenseCategory[]).map((c) => (
              <option key={c} value={c}>{EXPENSE_CATEGORY_LABEL[c]}</option>
            ))}
          </Select>
        </div>

        <div>
          <FieldLabel htmlFor="expense-comment">Комментарий</FieldLabel>
          <Input id="expense-comment" value={comment} onChange={(e) => setComment(e.target.value)} disabled={create.isPending} />
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
