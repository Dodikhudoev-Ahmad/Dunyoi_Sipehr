import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAdminBootstrap } from '@/admin/hooks/useAdminAuth'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FieldLabel, FieldError, Input } from '@/components/ui/Input'
import { adminErrorMessage } from '@/lib/apiError'
import logo from '@/assets/brand/logo.png'

// Mirrors BootstrapAdminCommandValidator (backend/Application/Features/Auth/Commands/BootstrapAdminCommand.cs).
const schema = z.object({
  displayName: z.string().min(1, { message: 'Введите имя' }).max(200, { message: 'Слишком длинное имя' }),
  email: z.string().email({ message: 'Введите корректный e-mail' }),
  password: z.string().min(10, { message: 'Минимум 10 символов' }),
})
type FormValues = z.infer<typeof schema>

/**
 * Unlisted, unlinked first-run screen: `POST /auth/bootstrap` only ever succeeds while zero
 * AdminUsers exist (see API_CONTRACT.md), so this page is only reachable/useful once, right
 * after a fresh deploy — reached by typing the URL directly, not from any nav. See
 * docs/DECISIONS.md for why this exists instead of leaving bootstrap to curl/Swagger only.
 */
export function BootstrapPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const bootstrap = useAdminBootstrap()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  const onSubmit = handleSubmit((values) => {
    bootstrap.mutate(values, { onSuccess: () => navigate('/admin', { replace: true }) })
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <Card className="w-full max-w-sm bg-elevated/95 p-8">
        <div className="mb-6 flex items-center gap-2.5 font-display text-xl">
          <img src={logo} alt="" aria-hidden className="h-9 w-9 shrink-0 object-contain" /> Dunyoi Sipehr
        </div>
        <h1 className="mb-2 text-lg font-medium text-slate">Создание первого администратора</h1>
        <p className="mb-6 text-sm text-slate">
          Доступно только один раз, пока в системе нет ни одного администратора.
        </p>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <FieldLabel htmlFor="displayName">Имя</FieldLabel>
            <Input id="displayName" invalid={Boolean(errors.displayName)} {...register('displayName')} />
            <FieldError>{errors.displayName?.message}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="email">Эл. почта</FieldLabel>
            <Input id="email" type="email" invalid={Boolean(errors.email)} {...register('email')} />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="password">Пароль</FieldLabel>
            <Input id="password" type="password" invalid={Boolean(errors.password)} {...register('password')} />
            <FieldError>{errors.password?.message}</FieldError>
          </div>

          {bootstrap.isError && (
            <p className="text-sm text-danger">{adminErrorMessage('Не удалось создать администратора', bootstrap.error)}</p>
          )}

          <Button type="submit" className="w-full" disabled={bootstrap.isPending}>
            {bootstrap.isPending ? 'Создание…' : 'Создать и войти'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
