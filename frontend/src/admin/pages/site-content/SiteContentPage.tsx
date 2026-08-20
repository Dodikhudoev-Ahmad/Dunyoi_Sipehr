import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { siteContentApi } from '@/api/siteContent'
import { LOCALES, type Locale, type AdminSiteContentItem } from '@/types/domain'
import { findTranslation } from '@/lib/translations'
import { PageHeader } from '@/admin/components/PageHeader'
import { LocaleTabs } from '@/admin/components/LocaleTabs'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, FieldLabel, FieldError } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { adminErrorMessage } from '@/lib/apiError'
import { requiredError, maxLengthError, hasErrors } from '@/lib/adminFormValidation'

interface FormState {
  id: string | null
  key: string
  titles: Record<Locale, string>
  bodies: Record<Locale, string>
}

function toFormState(entry: AdminSiteContentItem | null, key: string): FormState {
  if (!entry) return { id: null, key, titles: { ru: '', tg: '', en: '' }, bodies: { ru: '', tg: '', en: '' } }
  return {
    id: entry.id,
    key: entry.key,
    titles: Object.fromEntries(LOCALES.map((l) => [l, findTranslation(entry.translations, l)?.title ?? ''])) as Record<Locale, string>,
    bodies: Object.fromEntries(LOCALES.map((l) => [l, findTranslation(entry.translations, l)?.body ?? ''])) as Record<Locale, string>,
  }
}

export function SiteContentPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [activeLocale, setActiveLocale] = useState<Locale>('ru')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const list = useQuery({ queryKey: ['admin', 'site-content'], queryFn: () => siteContentApi.adminList({ page: 1, pageSize: 100, sort: 'key' }) })

  const activeEntry = list.data?.items.find((e) => e.key === selectedKey) ?? null
  const [form, setForm] = useState<FormState | null>(null)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  function openKey(key: string) {
    setSelectedKey(key)
    setForm(toFormState(list.data?.items.find((e) => e.key === key) ?? null, key))
    setActiveLocale('ru')
    setErrors({})
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!form) throw new Error('No form state')
      const payload = {
        key: form.key,
        translations: LOCALES.map((locale) => ({ locale, title: form.titles[locale], body: form.bodies[locale] })),
      }
      if (form.id) {
        await siteContentApi.adminUpdate(form.id, payload)
      } else {
        await siteContentApi.adminCreate(payload)
      }
    },
    onSuccess: () => {
      showToast('Контент сохранён')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'site-content'] })
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось сохранить контент', error), 'error'),
  })

  // Mirrors CreateSiteContentCommandValidator/UpdateSiteContentCommandValidator
  // (backend/Application/Features/Content/Commands/SiteContentCommands.cs).
  function validate(current: FormState): Record<string, string | undefined> {
    return { key: requiredError(current.key) ?? maxLengthError(current.key, 100) }
  }

  function handleSave() {
    if (!form) return
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (hasErrors(validationErrors)) return
    save.mutate()
  }

  const KNOWN_KEYS = ['hero', 'about', 'contacts', 'privacy-policy']

  return (
    <div>
      <PageHeader title="Контент сайта" />

      {list.isPending && <Skeleton className="h-40 w-full" />}
      {list.isError && <ErrorState onRetry={() => list.refetch()} />}

      {list.isSuccess && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          <div className="space-y-1">
            {[...new Set([...KNOWN_KEYS, ...list.data.items.map((e) => e.key)])].map((key) => (
              <button
                key={key}
                onClick={() => openKey(key)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${selectedKey === key ? 'bg-ink text-white' : 'text-slate hover:bg-text/5'}`}
              >
                {key}
              </button>
            ))}
          </div>

          <div>
            {!form && <EmptyState title="Выберите ключ слева, чтобы редактировать содержимое" />}
            {form && (
              <Card className="space-y-5 p-6">
                <div>
                  <FieldLabel>Ключ</FieldLabel>
                  <Input
                    invalid={Boolean(errors.key)}
                    value={form.key}
                    disabled={Boolean(activeEntry)}
                    onChange={(e) => setForm({ ...form, key: e.target.value })}
                  />
                  <FieldError>{errors.key}</FieldError>
                </div>

                <LocaleTabs active={activeLocale} onChange={setActiveLocale} />
                <div>
                  <FieldLabel>Заголовок</FieldLabel>
                  <Input
                    value={form.titles[activeLocale]}
                    onChange={(e) => setForm({ ...form, titles: { ...form.titles, [activeLocale]: e.target.value } })}
                  />
                </div>
                <div>
                  <FieldLabel>Текст</FieldLabel>
                  <Textarea
                    className="min-h-48"
                    value={form.bodies[activeLocale]}
                    onChange={(e) => setForm({ ...form, bodies: { ...form.bodies, [activeLocale]: e.target.value } })}
                  />
                </div>

                <Button onClick={handleSave} disabled={save.isPending}>
                  Сохранить
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
