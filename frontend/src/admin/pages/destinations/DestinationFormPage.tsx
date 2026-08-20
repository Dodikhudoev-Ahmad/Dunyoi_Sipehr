import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { destinationsApi } from '@/api/destinations'
import { citiesApi } from '@/api/cities'
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
import { requiredError, maxLengthError, hasErrors } from '@/lib/adminFormValidation'
import { findTranslation } from '@/lib/translations'

interface TranslationState {
  title: string
  summary: string
  description: string
  highlights: string
  metaTitle: string
  metaDescription: string
}

interface FormState {
  cityId: string
  slug: string
  heroImageUrl: string
  galleryUrls: string
  isFeatured: boolean
  isPublished: boolean
  sortOrder: number
  translations: Record<Locale, TranslationState>
}

const emptyTranslation: TranslationState = { title: '', summary: '', description: '', highlights: '', metaTitle: '', metaDescription: '' }

const empty: FormState = {
  cityId: '',
  slug: '',
  heroImageUrl: '',
  galleryUrls: '',
  isFeatured: false,
  isPublished: true,
  sortOrder: 0,
  translations: { ru: { ...emptyTranslation }, tg: { ...emptyTranslation }, en: { ...emptyTranslation } },
}

export function DestinationFormPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [activeLocale, setActiveLocale] = useState<Locale>('ru')
  const [form, setForm] = useState<FormState>(empty)
  const [loaded, setLoaded] = useState(isNew)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const cities = useQuery({ queryKey: ['admin', 'cities-for-select'], queryFn: () => citiesApi.adminList({ page: 1, pageSize: 200, sort: 'sortOrder' }) })

  const existing = useQuery({
    queryKey: ['admin', 'destination', id],
    queryFn: () => destinationsApi.adminGet(id as string),
    enabled: !isNew,
  })

  if (existing.isSuccess && !loaded) {
    const d = existing.data
    setForm({
      cityId: d.cityId,
      slug: d.slug,
      heroImageUrl: d.heroImageUrl ?? '',
      galleryUrls: d.galleryUrls.join('\n'),
      isFeatured: d.isFeatured,
      isPublished: d.isPublished,
      sortOrder: d.sortOrder,
      translations: Object.fromEntries(
        LOCALES.map((l) => {
          // GET /admin/destinations/{id} returns an UpsertDestinationInput (backend/Application/
          // Features/Destinations/Dtos/DestinationDtos.cs) — it has no top-level title/summary/
          // description/highlights at all, only `translations[]`. There is no such thing as
          // "the ru version" to fall back to outside that array, so a missing translation
          // legitimately defaults to empty, not to a fabricated top-level field.
          const t = findTranslation(d.translations, l)
          return [
            l,
            {
              title: t?.title ?? '',
              summary: t?.summary ?? '',
              description: t?.description ?? '',
              highlights: (t?.highlights ?? []).join('\n'),
              metaTitle: t?.metaTitle ?? '',
              metaDescription: t?.metaDescription ?? '',
            },
          ]
        }),
      ) as Record<Locale, TranslationState>,
    })
    setLoaded(true)
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        cityId: form.cityId,
        slug: form.slug,
        heroImageUrl: form.heroImageUrl,
        galleryUrls: form.galleryUrls.split('\n').map((s) => s.trim()).filter(Boolean),
        isFeatured: form.isFeatured,
        isPublished: form.isPublished,
        sortOrder: form.sortOrder,
        translations: LOCALES.map((locale) => {
          const t = form.translations[locale]
          return {
            locale,
            title: t.title,
            summary: t.summary,
            description: t.description,
            highlights: t.highlights.split('\n').map((s) => s.trim()).filter(Boolean),
            metaTitle: t.metaTitle,
            metaDescription: t.metaDescription,
          }
        }),
      }
      if (isNew) {
        await destinationsApi.adminCreate(payload)
      } else {
        await destinationsApi.adminUpdate(id as string, payload)
      }
    },
    onSuccess: () => {
      showToast('Направление сохранено')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] })
      navigate('/admin/destinations')
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось сохранить направление', error), 'error'),
  })

  if (!isNew && existing.isPending) return <Skeleton className="h-64 w-full" />
  if (!isNew && existing.isError) return <ErrorState onRetry={() => existing.refetch()} />

  const t = form.translations[activeLocale]

  // Mirrors CreateDestinationCommandValidator/UpdateDestinationCommandValidator
  // (backend/Application/Features/Destinations/Commands/DestinationAdminCommands.cs).
  function validate(): Record<string, string | undefined> {
    return {
      cityId: requiredError(form.cityId, 'Выберите город'),
      slug: requiredError(form.slug) ?? maxLengthError(form.slug, 200),
    }
  }

  function handleSave() {
    const validationErrors = validate()
    setErrors(validationErrors)
    if (hasErrors(validationErrors)) return
    save.mutate()
  }

  function updateTranslation(patch: Partial<TranslationState>) {
    setForm({ ...form, translations: { ...form.translations, [activeLocale]: { ...t, ...patch } } })
  }

  return (
    <div>
      <PageHeader title={isNew ? 'Новое направление' : 'Редактирование направления'} />
      <Card className="max-w-3xl space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Город</FieldLabel>
            <select
              className="w-full rounded-lg border border-text/15 bg-elevated px-4 py-2.5"
              value={form.cityId}
              onChange={(e) => setForm({ ...form, cityId: e.target.value })}
            >
              <option value="">— выберите город —</option>
              {cities.data?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {findTranslation(c.translations, 'ru')?.name ?? c.id}
                </option>
              ))}
            </select>
            <FieldError>{errors.cityId}</FieldError>
          </div>
          <div>
            <FieldLabel>Slug</FieldLabel>
            <Input
              invalid={Boolean(errors.slug)}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="dubai-city-tour"
            />
            <FieldError>{errors.slug}</FieldError>
          </div>
          <div>
            <FieldLabel>URL обложки</FieldLabel>
            <Input value={form.heroImageUrl} onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Порядок сортировки</FieldLabel>
            <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          </div>
        </div>

        <div>
          <FieldLabel>Галерея (по одной ссылке на строку)</FieldLabel>
          <Textarea value={form.galleryUrls} onChange={(e) => setForm({ ...form, galleryUrls: e.target.value })} />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
            Избранное
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
            Опубликовано
          </label>
        </div>

        <LocaleTabs active={activeLocale} onChange={setActiveLocale} />
        <div className="grid grid-cols-1 gap-4">
          <div>
            <FieldLabel>Заголовок</FieldLabel>
            <Input value={t.title} onChange={(e) => updateTranslation({ title: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Краткое описание</FieldLabel>
            <Textarea value={t.summary} onChange={(e) => updateTranslation({ summary: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Полное описание</FieldLabel>
            <Textarea className="min-h-40" value={t.description} onChange={(e) => updateTranslation({ description: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Особенности (по одной на строку)</FieldLabel>
            <Textarea value={t.highlights} onChange={(e) => updateTranslation({ highlights: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Meta Title</FieldLabel>
              <Input value={t.metaTitle} onChange={(e) => updateTranslation({ metaTitle: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Meta Description</FieldLabel>
              <Input value={t.metaDescription} onChange={(e) => updateTranslation({ metaDescription: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={save.isPending}>
            Сохранить
          </Button>
          <Button variant="ghost" onClick={() => navigate('/admin/destinations')}>
            Отмена
          </Button>
        </div>
      </Card>
    </div>
  )
}
