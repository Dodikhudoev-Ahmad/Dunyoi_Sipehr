import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAdminLogin } from '@/admin/hooks/useAdminAuth'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FieldLabel, FieldError, Input } from '@/components/ui/Input'
import { adminErrorMessage } from '@/lib/apiError'
import logo from '@/assets/brand/logo.png'

const schema = z.object({
  email: z.string().email({ message: 'Введите корректный e-mail' }),
  password: z.string().min(1, { message: 'Введите пароль' }),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const login = useAdminLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from
    return <Navigate to={from?.pathname ?? '/admin'} replace />
  }

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, { onSuccess: () => navigate('/admin', { replace: true }) })
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <Card className="w-full max-w-sm bg-elevated/95 p-8">
        <div className="mb-6 flex items-center gap-2.5 font-display text-xl">
          <img src={logo} alt="" aria-hidden className="h-9 w-9 shrink-0 object-contain" /> Dunyoi Sipehr
        </div>
        <h1 className="mb-6 text-lg font-medium text-slate">Вход для администратора</h1>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
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

          {login.isError && (
            <p className="text-sm text-danger">{adminErrorMessage('Не удалось войти', login.error)}</p>
          )}

          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? 'Вход…' : 'Войти'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
