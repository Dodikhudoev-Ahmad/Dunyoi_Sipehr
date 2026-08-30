import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { offersApi } from '@/api/offers'
import { destinationsApi } from '@/api/destinations'
import { servicesApi } from '@/api/services'
import { LOCALES, type Currency, type Locale } from '@/types/domain'
import { PageHeader } from '@/admin/components/PageHeader'
import { LocaleTabs } from '@/admin/components/LocaleTabs'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, FieldLabel, FieldError } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useToast } from '@/components/ui/Toast'
import { adminErrorMessage } from '@/lib/apiError'
import { requiredError, maxLengthError, minError, hasErrors } from '@/lib/adminFormValidation'
import { findTranslation } from '@/lib/translations'

interface TranslationState {
  title: string
  summary: string
  description: string
  metaTitle: string
  metaDescription: string
}

interface FormState {
  destinationId: string
  slug: string
  priceFrom: number
  currency: Currency
  durationDays: number | ''
  galleryUrls: string
  validUntilUtc: string
  isFeatured: boolean
  isPublished: boolean
  sortOrder: number
  serviceIds: string[]
  translations: Record<Locale, TranslationState>
}

const emptyTranslation: TranslationState = { title: '', summary: '', description: '', metaTitle: '', metaDescription: '' }

const empty: FormState = {
  destinationId: '',
  slug: '',
  priceFrom: 0,
  currency: 'USD',
  durationDays: '',
  galleryUrls: '',
  validUntilUtc: '',
  isFeatured: false,
  isPublished: true,
  sortOrder: 0,
  serviceIds: [],
  translations: { ru: { ...emptyTranslation }, tg: { ...emptyTranslation }, en: { ...emptyTranslation } },
}

export function OfferFormPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [activeLocale, setActiveLocale] = useState<Locale>('ru')
  const [form, setForm] = useState<FormState>(empty)
  const [loaded, setLoaded] = useState(isNew)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const destinations = useQuery({ queryKey: ['admin', 'destinations-for-select'], queryFn: () => destinationsApi.adminList({ page: 1, pageSize: 200, sort: 'sortOrder' }) })
  const services = useQuery({ queryKey: ['admin', 'services-for-select'], queryFn: () => servicesApi.adminList({ page: 1, pageSize: 200, sort: 'sortOrder' }) })

  const existing = useQuery({
    queryKey: ['admin', 'offer', id],
    queryFn: () => offersApi.adminGet(id as string),
    enabled: !isNew,
  })

  if (existing.isSuccess && !loaded) {
    const o = existing.data
    setForm({
      destinationId: o.destinationId ?? '',
      slug: o.slug,
      priceFrom: o.priceFrom,
      // Backend serializes the Currency enum using the raw C# member name ("Usd"/"Eur"/"Tjs" —
      // verified live), not the app's uppercase codes ('USD'/'EUR'/'TJS') the <Select> options
      // below use. Normalize on load so the existing value is actually pre-selected.
      currency: o.currency.toUpperCase() as Currency,
      durationDays: o.durationDays ?? '',
      galleryUrls: (o.galleryUrls ?? []).join('\n'),
      validUntilUtc: o.validUntilUtc ? o.validUntilUtc.slice(0, 10) : '',
      isFeatured: o.isFeatured,
      isPublished: o.isPublished,
      sortOrder: o.sortOrder,
      serviceIds: o.serviceIds,
      // GET /admin/offers/{id} returns an UpsertOfferInput — no top-level title/summary/
      // description at all, only `translations[]`. No fabricated top-level fallback.
      translations: Object.fromEntries(
        LOCALES.map((l) => {
          const t = findTranslation(o.translations, l)
          return [
            l,
            {
              title: t?.title ?? '',
              summary: t?.summary ?? '',
              description: t?.description ?? '',
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
        destinationId: form.destinationId || null,
        slug: form.slug,
        priceFrom: form.priceFrom,
        currency: form.currency,
        durationDays: form.durationDays === '' ? null : Number(form.durationDays),
        galleryUrls: form.galleryUrls.split('\n').map((s) => s.trim()).filter(Boolean),
        validUntilUtc: form.validUntilUtc ? new Date(form.validUntilUtc).toISOString() : null,
        isFeatured: form.isFeatured,
        isPublished: form.isPublished,
        sortOrder: form.sortOrder,
        serviceIds: form.serviceIds,
        translations: LOCALES.map((locale) => ({ locale, ...form.translations[locale] })),
      }
      if (isNew) {
        await offersApi.adminCreate(payload)
      } else {
        await offersApi.adminUpdate(id as string, payload)
      }
    },
    onSuccess: () => {
      showToast('Предложение сохранено')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] })
      navigate('/admin/offers')
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось сохранить предложение', error), 'error'),
  })

  if (!isNew && existing.isPending) return <Skeleton className="h-64 w-full" />
  if (!isNew && existing.isError) return <ErrorState onRetry={() => existing.refetch()} />

  const t = form.translations[activeLocale]
  function updateTranslation(patch: Partial<TranslationState>) {
    setForm({ ...form, translations: { ...form.translations, [activeLocale]: { ...t, ...patch } } })
  }

  // Mirrors CreateOfferCommandValidator/UpdateOfferCommandValidator (backend/Application/Features/Offers/Commands/OfferCommands.cs).
  function validate(): Record<string, string | undefined> {
    return {
      slug: requiredError(form.slug) ?? maxLengthError(form.slug, 200),
      priceFrom: minError(form.priceFrom, 0),
    }
  }

  function handleSave() {
    const validationErrors = validate()
    setErrors(validationErrors)
    if (hasErrors(validationErrors)) return
    save.mutate()
  }

  function toggleService(serviceId: string) {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(serviceId) ? f.serviceIds.filter((id2) => id2 !== serviceId) : [...f.serviceIds, serviceId],
    }))
  }

  return (
    <div>
      <PageHeader title={isNew ? 'Новое предложение' : 'Редактирование предложения'} />
      <Card className="max-w-3xl space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Направление (необязательно)</FieldLabel>
            <Select value={form.destinationId} onChange={(e) => setForm({ ...form, destinationId: e.target.value })}>
              <option value="">— без направления —</option>
              {destinations.data?.items.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.cityName} — {d.slug}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>Slug</FieldLabel>
            <Input invalid={Boolean(errors.slug)} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <FieldError>{errors.slug}</FieldError>
          </div>
          <div>
            <FieldLabel>Цена от</FieldLabel>
            <Input
              type="number"
              invalid={Boolean(errors.priceFrom)}
              value={form.priceFrom}
              onChange={(e) => setForm({ ...form, priceFrom: Number(e.target.value) })}
            />
            <FieldError>{errors.priceFrom}</FieldError>
          </div>
          <div>
            <FieldLabel>Валюта</FieldLabel>
            <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as Currency })}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="TJS">TJS</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Длительность (дней)</FieldLabel>
            <Input
              type="number"
              value={form.durationDays}
              onChange={(e) => setForm({ ...form, durationDays: e.target.value === '' ? '' : Number(e.target.value) })}
            />
          </div>
          <div>
            <FieldLabel>Действует до</FieldLabel>
            <Input type="date" value={form.validUntilUtc} onChange={(e) => setForm({ ...form, validUntilUtc: e.target.value })} />
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

        <div>
          <FieldLabel>Услуги в составе</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {services.data?.items.map((s) => (
              <label
                key={s.id}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${form.serviceIds.includes(s.id) ? 'border-brand bg-brand/10 text-brand' : 'border-text/15 text-slate'}`}
              >
                <input type="checkbox" className="hidden" checked={form.serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} />
                {findTranslation(s.translations, 'ru')?.name ?? s.icon}
              </label>
            ))}
          </div>
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
          <Button variant="ghost" onClick={() => navigate('/admin/offers')}>
            Отмена
          </Button>
        </div>
      </Card>
    </div>
  )
}
