import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '@/api/services'
import { LOCALES, type Locale } from '@/types/domain'
import { PageHeader } from '@/admin/components/PageHeader'
import { LocaleTabs } from '@/admin/components/LocaleTabs'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, FieldLabel, FieldError } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useToast } from '@/components/ui/Toast'
import { adminErrorMessage } from '@/lib/apiError'
import { requiredError, hasErrors } from '@/lib/adminFormValidation'
import { findTranslation } from '@/lib/translations'

interface FormState {
  icon: string
  sortOrder: number
  isPublished: boolean
  names: Record<Locale, string>
  descriptions: Record<Locale, string>
}

const empty: FormState = {
  icon: 'Compass',
  sortOrder: 0,
  isPublished: true,
  names: { ru: '', tg: '', en: '' },
  descriptions: { ru: '', tg: '', en: '' },
}

export function ServiceFormPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [activeLocale, setActiveLocale] = useState<Locale>('ru')
  const [form, setForm] = useState<FormState>(empty)
  const [loaded, setLoaded] = useState(isNew)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const existing = useQuery({
    queryKey: ['admin', 'service', id],
    queryFn: () => servicesApi.adminGet(id as string),
    enabled: !isNew,
  })

  if (existing.isSuccess && !loaded) {
    const s = existing.data
    setForm({
      icon: s.icon,
      sortOrder: s.sortOrder,
      isPublished: s.isPublished,
      names: Object.fromEntries(LOCALES.map((l) => [l, findTranslation(s.translations, l)?.name ?? ''])) as Record<Locale, string>,
      descriptions: Object.fromEntries(LOCALES.map((l) => [l, findTranslation(s.translations, l)?.description ?? ''])) as Record<Locale, string>,
    })
    setLoaded(true)
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        icon: form.icon,
        sortOrder: form.sortOrder,
        isPublished: form.isPublished,
        translations: LOCALES.map((locale) => ({ locale, name: form.names[locale], description: form.descriptions[locale] })),
      }
      if (isNew) {
        await servicesApi.adminCreate(payload)
      } else {
        await servicesApi.adminUpdate(id as string, payload)
      }
    },
    onSuccess: () => {
      showToast('Услуга сохранена')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'services'] })
      navigate('/admin/services')
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось сохранить услугу', error), 'error'),
  })

  if (!isNew && existing.isPending) return <Skeleton className="h-64 w-full" />
  if (!isNew && existing.isError) return <ErrorState onRetry={() => existing.refetch()} />

  // Mirrors CreateServiceCommandValidator/UpdateServiceCommandValidator
  // (backend/Application/Features/Services/Commands/ServiceCommands.cs).
  function validate(): Record<string, string | undefined> {
    return { icon: requiredError(form.icon, 'Укажите иконку') }
  }

  function handleSave() {
    const validationErrors = validate()
    setErrors(validationErrors)
    if (hasErrors(validationErrors)) return
    save.mutate()
  }

  return (
    <div>
      <PageHeader title={isNew ? 'Новая услуга' : 'Редактирование услуги'} />
      <Card className="max-w-2xl space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Иконка (lucide-react)</FieldLabel>
            <Input invalid={Boolean(errors.icon)} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Compass" />
            <FieldError>{errors.icon}</FieldError>
          </div>
          <div>
            <FieldLabel>Порядок сортировки</FieldLabel>
            <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
          Опубликовано
        </label>

        <LocaleTabs active={activeLocale} onChange={setActiveLocale} />
        <div>
          <FieldLabel>Название</FieldLabel>
          <Input
            value={form.names[activeLocale]}
            onChange={(e) => setForm({ ...form, names: { ...form.names, [activeLocale]: e.target.value } })}
          />
        </div>
        <div>
          <FieldLabel>Описание</FieldLabel>
          <Textarea
            value={form.descriptions[activeLocale]}
            onChange={(e) => setForm({ ...form, descriptions: { ...form.descriptions, [activeLocale]: e.target.value } })}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={save.isPending}>
            Сохранить
          </Button>
          <Button variant="ghost" onClick={() => navigate('/admin/services')}>
            Отмена
          </Button>
        </div>
      </Card>
    </div>
  )
}
