import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { faqApi } from '@/api/faq'
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
  category: string
  sortOrder: number
  isPublished: boolean
  questions: Record<Locale, string>
  answers: Record<Locale, string>
}

const empty: FormState = {
  category: 'general',
  sortOrder: 0,
  isPublished: true,
  questions: { ru: '', tg: '', en: '' },
  answers: { ru: '', tg: '', en: '' },
}

export function FaqFormPage() {
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
    queryKey: ['admin', 'faq-item', id],
    queryFn: () => faqApi.adminGet(id as string),
    enabled: !isNew,
  })

  if (existing.isSuccess && !loaded) {
    const f = existing.data
    setForm({
      category: f.category,
      sortOrder: f.sortOrder,
      isPublished: f.isPublished,
      questions: Object.fromEntries(LOCALES.map((l) => [l, findTranslation(f.translations, l)?.question ?? ''])) as Record<Locale, string>,
      answers: Object.fromEntries(LOCALES.map((l) => [l, findTranslation(f.translations, l)?.answer ?? ''])) as Record<Locale, string>,
    })
    setLoaded(true)
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        category: form.category,
        sortOrder: form.sortOrder,
        isPublished: form.isPublished,
        translations: LOCALES.map((locale) => ({ locale, question: form.questions[locale], answer: form.answers[locale] })),
      }
      if (isNew) {
        await faqApi.adminCreate(payload)
      } else {
        await faqApi.adminUpdate(id as string, payload)
      }
    },
    onSuccess: () => {
      showToast('Вопрос сохранён')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'faq'] })
      navigate('/admin/faq')
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось сохранить вопрос', error), 'error'),
  })

  if (!isNew && existing.isPending) return <Skeleton className="h-64 w-full" />
  if (!isNew && existing.isError) return <ErrorState onRetry={() => existing.refetch()} />

  // Mirrors CreateFaqItemCommandValidator/UpdateFaqItemCommandValidator
  // (backend/Application/Features/Content/Commands/FaqCommands.cs).
  function validate(): Record<string, string | undefined> {
    return { category: requiredError(form.category, 'Укажите категорию') }
  }

  function handleSave() {
    const validationErrors = validate()
    setErrors(validationErrors)
    if (hasErrors(validationErrors)) return
    save.mutate()
  }

  return (
    <div>
      <PageHeader title={isNew ? 'Новый вопрос' : 'Редактирование вопроса'} />
      <Card className="max-w-2xl space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Категория</FieldLabel>
            <Input invalid={Boolean(errors.category)} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <FieldError>{errors.category}</FieldError>
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
          <FieldLabel>Вопрос</FieldLabel>
          <Input
            value={form.questions[activeLocale]}
            onChange={(e) => setForm({ ...form, questions: { ...form.questions, [activeLocale]: e.target.value } })}
          />
        </div>
        <div>
          <FieldLabel>Ответ</FieldLabel>
          <Textarea
            value={form.answers[activeLocale]}
            onChange={(e) => setForm({ ...form, answers: { ...form.answers, [activeLocale]: e.target.value } })}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={save.isPending}>
            Сохранить
          </Button>
          <Button variant="ghost" onClick={() => navigate('/admin/faq')}>
            Отмена
          </Button>
        </div>
      </Card>
    </div>
  )
}
