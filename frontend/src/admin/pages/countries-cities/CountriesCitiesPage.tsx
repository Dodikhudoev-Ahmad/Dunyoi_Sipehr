import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { countriesApi } from '@/api/countries'
import { citiesApi } from '@/api/cities'
import { LOCALES, type AdminCountryItem, type AdminCityItem } from '@/types/domain'
import { findTranslation } from '@/lib/translations'
import { PageHeader } from '@/admin/components/PageHeader'
import { DataTable, type Column } from '@/admin/components/DataTable'
import { DeleteConfirmModal } from '@/admin/components/DeleteConfirmModal'
import { Button } from '@/components/ui/Button'
import { IconActionButton } from '@/components/ui/IconActionButton'
import { Input, FieldLabel, FieldError } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { adminErrorMessage } from '@/lib/apiError'
import { exactLengthError, requiredError, hasErrors } from '@/lib/adminFormValidation'

interface CountryFormState {
  id: string | null
  isoCode: string
  sortOrder: number
  names: Record<string, string>
}

const emptyCountryForm: CountryFormState = { id: null, isoCode: '', sortOrder: 0, names: { ru: '', tg: '', en: '' } }

interface CityFormState {
  id: string | null
  countryId: string
  sortOrder: number
  names: Record<string, string>
}

export function CountriesCitiesPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const countries = useQuery({ queryKey: ['admin', 'countries'], queryFn: () => countriesApi.adminList({ page: 1, pageSize: 100, sort: 'sortOrder' }) })
  const cities = useQuery({ queryKey: ['admin', 'cities'], queryFn: () => citiesApi.adminList({ page: 1, pageSize: 200, sort: 'sortOrder' }) })

  const [countryForm, setCountryForm] = useState<CountryFormState | null>(null)
  const [cityForm, setCityForm] = useState<CityFormState | null>(null)
  const [countryErrors, setCountryErrors] = useState<Record<string, string | undefined>>({})
  const [cityErrors, setCityErrors] = useState<Record<string, string | undefined>>({})
  const [deletingCountry, setDeletingCountry] = useState<AdminCountryItem | null>(null)
  const [deletingCity, setDeletingCity] = useState<AdminCityItem | null>(null)

  // Mirrors CreateCountryCommandValidator/UpdateCountryCommandValidator
  // (backend/Application/Features/Countries/Commands/CountryCommands.cs).
  function validateCountry(form: CountryFormState): Record<string, string | undefined> {
    return { isoCode: requiredError(form.isoCode) ?? exactLengthError(form.isoCode, 2) }
  }

  // Mirrors CreateCityCommandValidator/UpdateCityCommandValidator
  // (backend/Application/Features/Cities/Commands/CityCommands.cs).
  function validateCity(form: CityFormState): Record<string, string | undefined> {
    return { countryId: requiredError(form.countryId, 'Выберите страну') }
  }

  function handleSaveCountry() {
    if (!countryForm) return
    const validationErrors = validateCountry(countryForm)
    setCountryErrors(validationErrors)
    if (hasErrors(validationErrors)) return
    saveCountry.mutate(countryForm)
  }

  function handleSaveCity() {
    if (!cityForm) return
    const validationErrors = validateCity(cityForm)
    setCityErrors(validationErrors)
    if (hasErrors(validationErrors)) return
    saveCity.mutate(cityForm)
  }

  const saveCountry = useMutation({
    mutationFn: async (form: CountryFormState) => {
      const payload = {
        isoCode: form.isoCode,
        sortOrder: form.sortOrder,
        translations: LOCALES.map((locale) => ({ locale, name: form.names[locale] ?? '' })),
      }
      if (form.id) {
        await countriesApi.adminUpdate(form.id, payload)
      } else {
        await countriesApi.adminCreate(payload)
      }
    },
    onSuccess: () => {
      showToast('Страна сохранена')
      setCountryForm(null)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'countries'] })
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось сохранить страну', error), 'error'),
  })

  const deleteCountry = useMutation({
    mutationFn: (id: string) => countriesApi.adminDelete(id),
    onSuccess: () => {
      showToast('Страна удалена')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'countries'] })
      setDeletingCountry(null)
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось удалить страну', error), 'error'),
  })

  const saveCity = useMutation({
    mutationFn: async (form: CityFormState) => {
      const payload = {
        countryId: form.countryId,
        sortOrder: form.sortOrder,
        translations: LOCALES.map((locale) => ({ locale, name: form.names[locale] ?? '' })),
      }
      if (form.id) {
        await citiesApi.adminUpdate(form.id, payload)
      } else {
        await citiesApi.adminCreate(payload)
      }
    },
    onSuccess: () => {
      showToast('Город сохранён')
      setCityForm(null)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'cities'] })
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось сохранить город', error), 'error'),
  })

  const deleteCity = useMutation({
    mutationFn: (id: string) => citiesApi.adminDelete(id),
    onSuccess: () => {
      showToast('Город удалён')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'cities'] })
      setDeletingCity(null)
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось удалить город', error), 'error'),
  })

  const countryColumns: Column<AdminCountryItem>[] = [
    { key: 'name', header: 'Название', render: (c) => findTranslation(c.translations, 'ru')?.name ?? '—' },
    { key: 'isoCode', header: 'ISO', render: (c) => c.isoCode },
    { key: 'sortOrder', header: 'Порядок', render: (c) => c.sortOrder },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <IconActionButton
            label="Редактировать"
            onClick={() => {
              setCountryForm({
                id: c.id,
                isoCode: c.isoCode,
                sortOrder: c.sortOrder,
                names: Object.fromEntries(LOCALES.map((l) => [l, findTranslation(c.translations, l)?.name ?? ''])),
              })
              setCountryErrors({})
            }}
          >
            <Pencil size={16} />
          </IconActionButton>
          <IconActionButton label="Удалить" tone="danger" onClick={() => setDeletingCountry(c)}>
            <Trash2 size={16} />
          </IconActionButton>
        </div>
      ),
    },
  ]

  const cityColumns: Column<AdminCityItem>[] = [
    { key: 'name', header: 'Название', render: (c) => findTranslation(c.translations, 'ru')?.name ?? '—' },
    {
      key: 'countryId',
      header: 'Страна',
      render: (c) => {
        const country = countries.data?.items.find((co) => co.id === c.countryId)
        return country ? (findTranslation(country.translations, 'ru')?.name ?? country.isoCode) : '—'
      },
    },
    { key: 'sortOrder', header: 'Порядок', render: (c) => c.sortOrder },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <IconActionButton
            label="Редактировать"
            onClick={() => {
              setCityForm({
                id: c.id,
                countryId: c.countryId,
                sortOrder: c.sortOrder,
                names: Object.fromEntries(LOCALES.map((l) => [l, findTranslation(c.translations, l)?.name ?? ''])),
              })
              setCityErrors({})
            }}
          >
            <Pencil size={16} />
          </IconActionButton>
          <IconActionButton label="Удалить" tone="danger" onClick={() => setDeletingCity(c)}>
            <Trash2 size={16} />
          </IconActionButton>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-12">
      <div>
        <PageHeader
          title="Страны"
          action={
            <Button
              size="sm"
              onClick={() => {
                setCountryForm(emptyCountryForm)
                setCountryErrors({})
              }}
            >
              <Plus size={15} /> Добавить страну
            </Button>
          }
        />
        {countryForm && (
          <Card className="mb-6 space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>ISO-код</FieldLabel>
                <Input
                  invalid={Boolean(countryErrors.isoCode)}
                  value={countryForm.isoCode}
                  maxLength={2}
                  onChange={(e) => setCountryForm({ ...countryForm, isoCode: e.target.value.toUpperCase() })}
                />
                <FieldError>{countryErrors.isoCode}</FieldError>
              </div>
              <div>
                <FieldLabel>Порядок сортировки</FieldLabel>
                <Input type="number" value={countryForm.sortOrder} onChange={(e) => setCountryForm({ ...countryForm, sortOrder: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {LOCALES.map((locale) => (
                <div key={locale}>
                  <FieldLabel>Название ({locale})</FieldLabel>
                  <Input
                    value={countryForm.names[locale] ?? ''}
                    onChange={(e) => setCountryForm({ ...countryForm, names: { ...countryForm.names, [locale]: e.target.value } })}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveCountry} disabled={saveCountry.isPending}>
                Сохранить
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCountryForm(null)}>
                Отмена
              </Button>
            </div>
          </Card>
        )}
        {countries.isPending && <Skeleton className="h-40 w-full" />}
        {countries.isError && <ErrorState onRetry={() => countries.refetch()} />}
        {countries.isSuccess && countries.data.items.length === 0 && <EmptyState title="Стран пока нет" />}
        {countries.isSuccess && countries.data.items.length > 0 && (
          <DataTable columns={countryColumns} rows={countries.data.items} rowKey={(c) => c.id} />
        )}
      </div>

      <div>
        <PageHeader
          title="Города"
          action={
            <Button
              size="sm"
              onClick={() => {
                setCityForm({ id: null, countryId: countries.data?.items[0]?.id ?? '', sortOrder: 0, names: { ru: '', tg: '', en: '' } })
                setCityErrors({})
              }}
              disabled={!countries.data?.items.length}
            >
              <Plus size={15} /> Добавить город
            </Button>
          }
        />
        {cityForm && (
          <Card className="mb-6 space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Страна</FieldLabel>
                <Select value={cityForm.countryId} onChange={(e) => setCityForm({ ...cityForm, countryId: e.target.value })}>
                  {countries.data?.items.map((c) => (
                    <option key={c.id} value={c.id}>
                      {findTranslation(c.translations, 'ru')?.name ?? c.isoCode}
                    </option>
                  ))}
                </Select>
                <FieldError>{cityErrors.countryId}</FieldError>
              </div>
              <div>
                <FieldLabel>Порядок сортировки</FieldLabel>
                <Input type="number" value={cityForm.sortOrder} onChange={(e) => setCityForm({ ...cityForm, sortOrder: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {LOCALES.map((locale) => (
                <div key={locale}>
                  <FieldLabel>Название ({locale})</FieldLabel>
                  <Input
                    value={cityForm.names[locale] ?? ''}
                    onChange={(e) => setCityForm({ ...cityForm, names: { ...cityForm.names, [locale]: e.target.value } })}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveCity} disabled={saveCity.isPending}>
                Сохранить
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCityForm(null)}>
                Отмена
              </Button>
            </div>
          </Card>
        )}
        {cities.isPending && <Skeleton className="h-40 w-full" />}
        {cities.isError && <ErrorState onRetry={() => cities.refetch()} />}
        {cities.isSuccess && cities.data.items.length === 0 && <EmptyState title="Городов пока нет" />}
        {cities.isSuccess && cities.data.items.length > 0 && <DataTable columns={cityColumns} rows={cities.data.items} rowKey={(c) => c.id} />}
      </div>

      <DeleteConfirmModal
        open={deletingCountry !== null}
        onClose={() => setDeletingCountry(null)}
        onConfirm={() => deletingCountry && deleteCountry.mutate(deletingCountry.id)}
        isPending={deleteCountry.isPending}
        title="Удалить страну?"
        description={`Страна «${deletingCountry ? (findTranslation(deletingCountry.translations, 'ru')?.name ?? deletingCountry.isoCode) : ''}» будет удалена безвозвратно.`}
      />
      <DeleteConfirmModal
        open={deletingCity !== null}
        onClose={() => setDeletingCity(null)}
        onConfirm={() => deletingCity && deleteCity.mutate(deletingCity.id)}
        isPending={deleteCity.isPending}
        title="Удалить город?"
        description={`Город «${deletingCity ? (findTranslation(deletingCity.translations, 'ru')?.name ?? '') : ''}» будет удалён безвозвратно.`}
      />
    </div>
  )
}
