import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { testimonialsApi } from '@/api/testimonials'
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
import { requiredError, rangeError, hasErrors } from '@/lib/adminFormValidation'
import { findTranslation } from '@/lib/translations'

interface FormState {
  authorName: string
  authorCountry: string
  avatarUrl: string
  rating: number
  isPublished: boolean
  sortOrder: number
  quotes: Record<Locale, string>
}

const empty: FormState = {
  authorName: '',
  authorCountry: '',
  avatarUrl: '',
  rating: 5,
  isPublished: true,
  sortOrder: 0,
  quotes: { ru: '', tg: '', en: '' },
}

export function TestimonialFormPage() {
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
    queryKey: ['admin', 'testimonial', id],
    queryFn: () => testimonialsApi.adminGet(id as string),
    enabled: !isNew,
  })

  if (existing.isSuccess && !loaded) {
    const t = existing.data
    setForm({
      authorName: t.authorName,
      authorCountry: t.authorCountry,
      avatarUrl: t.avatarUrl ?? '',
      rating: t.rating,
      isPublished: t.isPublished,
      sortOrder: t.sortOrder,
      quotes: Object.fromEntries(LOCALES.map((l) => [l, findTranslation(t.translations, l)?.quote ?? ''])) as Record<Locale, string>,
    })
    setLoaded(true)
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        authorName: form.authorName,
        authorCountry: form.authorCountry,
        avatarUrl: form.avatarUrl || null,
        rating: form.rating,
        isPublished: form.isPublished,
        sortOrder: form.sortOrder,
        translations: LOCALES.map((locale) => ({ locale, quote: form.quotes[locale] })),
      }
      if (isNew) {
        await testimonialsApi.adminCreate(payload)
      } else {
        await testimonialsApi.adminUpdate(id as string, payload)
      }
    },
    onSuccess: () => {
      showToast('Отзыв сохранён')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] })
      navigate('/admin/testimonials')
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось сохранить отзыв', error), 'error'),
  })

  if (!isNew && existing.isPending) return <Skeleton className="h-64 w-full" />
  if (!isNew && existing.isError) return <ErrorState onRetry={() => existing.refetch()} />

  // Mirrors CreateTestimonialCommandValidator/UpdateTestimonialCommandValidator
  // (backend/Application/Features/Content/Commands/TestimonialCommands.cs).
  function validate(): Record<string, string | undefined> {
    return {
      authorName: requiredError(form.authorName, 'Укажите имя автора'),
      rating: rangeError(form.rating, 1, 5),
    }
  }

  function handleSave() {
    const validationErrors = validate()
    setErrors(validationErrors)
    if (hasErrors(validationErrors)) return
    save.mutate()
  }

  return (
    <div>
      <PageHeader title={isNew ? 'Новый отзыв' : 'Редактирование отзыва'} />
      <Card className="max-w-2xl space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Имя автора</FieldLabel>
            <Input invalid={Boolean(errors.authorName)} value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
            <FieldError>{errors.authorName}</FieldError>
          </div>
          <div>
            <FieldLabel>Страна автора</FieldLabel>
            <Input value={form.authorCountry} onChange={(e) => setForm({ ...form, authorCountry: e.target.value })} />
          </div>
          <div>
            <FieldLabel>URL аватара</FieldLabel>
            <Input value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Рейтинг (1-5)</FieldLabel>
            <Input
              type="number"
              min={1}
              max={5}
              invalid={Boolean(errors.rating)}
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            />
            <FieldError>{errors.rating}</FieldError>
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
          <FieldLabel>Цитата</FieldLabel>
          <Textarea
            value={form.quotes[activeLocale]}
            onChange={(e) => setForm({ ...form, quotes: { ...form.quotes, [activeLocale]: e.target.value } })}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={save.isPending}>
            Сохранить
          </Button>
          <Button variant="ghost" onClick={() => navigate('/admin/testimonials')}>
            Отмена
          </Button>
        </div>
      </Card>
    </div>
  )
}
