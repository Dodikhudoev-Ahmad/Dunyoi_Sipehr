import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, KeyRound, Ban, CheckCircle2, Copy } from 'lucide-react'
import { adminStaffApi } from '@/api/adminStaff'
import type { AdminRole, AdminStaff } from '@/types/domain'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/admin/components/PageHeader'
import { DataTable, type Column } from '@/admin/components/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconActionButton } from '@/components/ui/IconActionButton'
import { Modal } from '@/components/ui/Modal'
import { FieldLabel, FieldError, Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { adminErrorMessage } from '@/lib/apiError'

const STAFF_KEY = ['admin', 'staff']

const ROLE_LABEL: Record<AdminRole, string> = { SuperAdmin: 'SuperAdmin', Editor: 'Editor' }

function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  const bytes = new Uint32Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

/** "Добавить сотрудника" modal — displayName/email/password (or auto-generate)/role. */
function AddStaffModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [role, setRole] = useState<AdminRole>('Editor')

  function reset() {
    setDisplayName('')
    setEmail('')
    setPassword('')
    setAutoGenerate(true)
    setRole('Editor')
  }

  const create = useMutation({
    mutationFn: () => adminStaffApi.create({ displayName, email, password: autoGenerate ? generatePassword() : password, role }),
    onSuccess: () => {
      showToast('Сотрудник добавлен')
      void queryClient.invalidateQueries({ queryKey: STAFF_KEY })
      reset()
      onClose()
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось добавить сотрудника', error), 'error'),
  })

  const canSubmit = displayName.trim().length > 0 && email.trim().length > 0 && (autoGenerate || password.length >= 10)

  return (
    <Modal open={open} onClose={() => { onClose(); reset() }} label="Добавить сотрудника" title="Добавить сотрудника">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (canSubmit) create.mutate()
        }}
      >
        <div>
          <FieldLabel htmlFor="staff-name">Имя</FieldLabel>
          <Input id="staff-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={create.isPending} />
        </div>
        <div>
          <FieldLabel htmlFor="staff-email">Email</FieldLabel>
          <Input id="staff-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={create.isPending} />
        </div>
        <div>
          <FieldLabel htmlFor="staff-role">Роль</FieldLabel>
          <Select id="staff-role" value={role} onChange={(e) => setRole(e.target.value as AdminRole)} disabled={create.isPending}>
            <option value="Editor">Editor</option>
            <option value="SuperAdmin">SuperAdmin</option>
          </Select>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-slate">
            <input
              type="checkbox"
              checked={autoGenerate}
              onChange={(e) => setAutoGenerate(e.target.checked)}
              disabled={create.isPending}
            />
            Сгенерировать пароль автоматически
          </label>
          {!autoGenerate && (
            <div className="mt-2">
              <FieldLabel htmlFor="staff-password">Пароль</FieldLabel>
              <Input
                id="staff-password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={create.isPending}
                invalid={password.length > 0 && password.length < 10}
              />
              <FieldError>{password.length > 0 && password.length < 10 ? 'Минимум 10 символов' : undefined}</FieldError>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => { onClose(); reset() }} disabled={create.isPending}>
            Отмена
          </Button>
          <Button type="submit" disabled={!canSubmit || create.isPending}>
            {create.isPending ? 'Добавление…' : 'Добавить'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/** One-time password reveal after a reset — the value is never shown again once this closes. */
function RevealPasswordModal({ password, onClose }: { password: string | null; onClose: () => void }) {
  const { showToast } = useToast()
  return (
    <Modal open={password !== null} onClose={onClose} label="Новый пароль" title="Новый временный пароль">
      <p className="mb-3 text-sm text-danger">
        Запишите этот пароль сейчас — повторно он показан не будет.
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-text/15 bg-paper px-4 py-3 font-mono text-sm">
        <span className="flex-1 select-all break-all">{password}</span>
        <button
          type="button"
          aria-label="Скопировать"
          className="shrink-0 text-slate hover:text-brand"
          onClick={() => {
            if (password) void navigator.clipboard.writeText(password)
            showToast('Пароль скопирован')
          }}
        >
          <Copy size={16} />
        </button>
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={onClose}>Готово</Button>
      </div>
    </Modal>
  )
}

export function StaffListPage() {
  const { admin: currentAdmin } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null)

  const staff = useQuery({
    queryKey: STAFF_KEY,
    queryFn: () => adminStaffApi.list({ page: 1, pageSize: 100 }),
  })

  const update = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; role?: AdminRole; isActive?: boolean }) => adminStaffApi.update(id, payload),
    onSuccess: () => {
      showToast('Изменения сохранены')
      void queryClient.invalidateQueries({ queryKey: STAFF_KEY })
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось изменить сотрудника', error), 'error'),
  })

  const resetPassword = useMutation({
    mutationFn: (id: string) => adminStaffApi.resetPassword(id),
    onSuccess: (data) => setRevealedPassword(data.temporaryPassword),
    onError: (error) => showToast(adminErrorMessage('Не удалось сбросить пароль', error), 'error'),
  })

  const columns: Column<AdminStaff>[] = [
    { key: 'displayName', header: 'Имя', render: (s) => s.displayName },
    { key: 'email', header: 'Email', render: (s) => <span className="text-slate">{s.email}</span> },
    {
      key: 'role',
      header: 'Роль',
      render: (s) => (
        // Fixed-width wrapper, not a width class on the <select> itself: the Select's own
        // base styles already set w-full, and a plain width utility placed on the same
        // element loses that cascade tie unpredictably (bit us before on the travel-requests
        // filter). Worse here: since the table uses browser auto layout, a select stuck at
        // w-full gives the column no stable size hint, collapsing it to near-zero width and
        // clipping the role text down to an invisible sliver.
        <div className="w-36">
          <Select
            value={s.role}
            disabled={update.isPending || s.id === currentAdmin?.id}
            onChange={(e) => update.mutate({ id: s.id, role: e.target.value as AdminRole })}
            className="py-1.5 text-sm"
          >
            <option value="Editor">{ROLE_LABEL.Editor}</option>
            <option value="SuperAdmin">{ROLE_LABEL.SuperAdmin}</option>
          </Select>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Статус',
      render: (s) => <Badge tone={s.isActive ? 'success' : 'neutral'}>{s.isActive ? 'Активен' : 'Деактивирован'}</Badge>,
    },
    { key: 'createdAtUtc', header: 'Дата создания', render: (s) => new Date(s.createdAtUtc).toLocaleDateString('ru') },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <IconActionButton
            label="Сбросить пароль"
            onClick={() => resetPassword.mutate(s.id)}
            disabled={resetPassword.isPending}
          >
            <KeyRound size={16} />
          </IconActionButton>
          {s.isActive ? (
            <IconActionButton
              label={s.id === currentAdmin?.id ? 'Нельзя деактивировать свой аккаунт' : 'Деактивировать'}
              tone="danger"
              onClick={() => update.mutate({ id: s.id, isActive: false })}
              disabled={update.isPending || s.id === currentAdmin?.id}
            >
              <Ban size={16} />
            </IconActionButton>
          ) : (
            <IconActionButton
              label="Активировать"
              onClick={() => update.mutate({ id: s.id, isActive: true })}
              disabled={update.isPending}
            >
              <CheckCircle2 size={16} />
            </IconActionButton>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Сотрудники"
        action={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={15} /> Добавить сотрудника
          </Button>
        }
      />

      {staff.isPending && <Skeleton className="h-40 w-full" />}
      {staff.isError && <ErrorState onRetry={() => staff.refetch()} />}
      {staff.isSuccess && staff.data.items.length === 0 && <EmptyState title="Сотрудников пока нет" />}
      {staff.isSuccess && staff.data.items.length > 0 && (
        <DataTable columns={columns} rows={staff.data.items} rowKey={(s) => s.id} />
      )}

      <AddStaffModal open={addOpen} onClose={() => setAddOpen(false)} />
      <RevealPasswordModal password={revealedPassword} onClose={() => setRevealedPassword(null)} />
    </div>
  )
}
