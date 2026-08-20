import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Upload, X, Loader2 } from 'lucide-react'
import { useLocale } from '@/i18n/LocaleContext'
import { useDestinations, useOffers } from '@/hooks/usePublicData'
import { travelRequestsApi } from '@/api/travelRequests'
import { ApiError } from '@/types/api'
import { publicErrorMessage } from '@/lib/apiError'
import { travelRequestSchema, todayIso, MAX_PASSENGERS, MAX_PASSPORT_PHOTOS, type TravelRequestFormValues } from '@/lib/validation'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FieldLabel, FieldError, Input, Textarea, Select } from '@/components/ui/Input'
import { editorialImages } from '@/lib/editorialImages'
import { cn } from '@/lib/cn'

const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024

interface PassportPhoto {
  id: string
  file: File
  previewUrl: string
  fileName?: string
  status: 'uploading' | 'done' | 'error'
  errorKey?: string
}

export function TravelRequestPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const [searchParams] = useSearchParams()

  const destinations = useDestinations(locale, { pageSize: 100 })
  const offers = useOffers(locale, { pageSize: 100 })

  const [photos, setPhotos] = useState<PassportPhoto[]>([])
  const [photosTouched, setPhotosTouched] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
    reset,
  } = useForm<TravelRequestFormValues>({
    resolver: zodResolver(travelRequestSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      destinationId: searchParams.get('destinationId') ?? '',
      offerId: searchParams.get('offerId') ?? '',
      departureDate: '',
      returnDate: '',
      passengersAdults: 1,
      passengersChildren: 0,
      childrenAges: [],
      message: '',
      consentAccepted: undefined as unknown as true,
      passportConsentAccepted: undefined as unknown as true,
      website: '',
    },
  })

  const childrenCount = watch('passengersChildren')
  const departureDate = watch('departureDate')

  // Keep childrenAges in sync with the children headcount — grows/shrinks the array, preserving
  // ages already entered for indices that still exist.
  useEffect(() => {
    const current = getValues('childrenAges') ?? []
    const clamped = Math.max(0, Math.min(childrenCount || 0, MAX_PASSENGERS))
    if (current.length === clamped) return
    setValue('childrenAges', Array.from({ length: clamped }, (_, i) => current[i] ?? 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenCount])

  const uploadMutation = useMutation({
    mutationFn: (file: File) => travelRequestsApi.publicUploadPassportPhoto(file),
  })

  function addPhotoFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file) return
    setPhotosTouched(true)

    if (photos.length >= MAX_PASSPORT_PHOTOS) return

    if (!file.type.startsWith('image/')) {
      setPhotos((prev) => [...prev, { id: crypto.randomUUID(), file, previewUrl: '', status: 'error', errorKey: 'validation.fileInvalidType' }])
      return
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setPhotos((prev) => [...prev, { id: crypto.randomUUID(), file, previewUrl: '', status: 'error', errorKey: 'validation.fileTooLarge' }])
      return
    }

    const id = crypto.randomUUID()
    const previewUrl = URL.createObjectURL(file)
    setPhotos((prev) => [...prev, { id, file, previewUrl, status: 'uploading' }])

    uploadMutation.mutate(file, {
      onSuccess: (fileName) => {
        setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, fileName, status: 'done' } : p)))
      },
      onError: () => {
        setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'error', errorKey: 'validation.uploadFailed' } : p)))
      },
    })
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id)
      if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }

  const uploadedFileNames = photos.filter((p) => p.status === 'done' && p.fileName).map((p) => p.fileName!)
  const hasUploadingPhoto = photos.some((p) => p.status === 'uploading')
  const showPassportPhotoRequiredError = photosTouched && uploadedFileNames.length === 0

  const mutation = useMutation({
    mutationFn: (values: TravelRequestFormValues) =>
      travelRequestsApi.publicSubmit({
        fullName: values.fullName,
        email: values.email,
        phone: `+992${values.phone}`,
        preferredLocale: locale,
        destinationId: values.destinationId || null,
        offerId: values.offerId || null,
        departureDate: values.departureDate,
        returnDate: values.returnDate || null,
        passengersAdults: values.passengersAdults,
        passengersChildren: values.passengersChildren,
        childrenAges: values.childrenAges,
        message: values.message,
        passportPhotoPaths: uploadedFileNames,
        passportDataConsentAccepted: values.passportConsentAccepted,
        consentAccepted: values.consentAccepted,
        website: values.website,
      }),
    onSuccess: () => {
      reset()
      photos.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl))
      setPhotos([])
      setPhotosTouched(false)
    },
  })

  const onSubmit = handleSubmit((values) => {
    setPhotosTouched(true)
    if (uploadedFileNames.length === 0 || hasUploadingPhoto) return
    mutation.mutate(values)
  })

  return (
    <>
      <PageHero
        image={editorialImages.travelRequestHeader}
        eyebrow={t('nav.travelRequest')}
        title={t('travelRequest.title')}
        subtitle={t('travelRequest.subtitle')}
      />
      <Section>
      <div className="mx-auto max-w-2xl">
        <Card className="p-6 md:p-8">
          {mutation.isSuccess ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 size={36} className="text-success" />
              <h2 className="text-xl font-medium">{t('travelRequest.successTitle')}</h2>
              <p className="text-slate">{t('travelRequest.successBody')}</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              {/* Honeypot: hidden from real users via .honeypot-field (see index.css), left in the tab order for bots. */}
              <div className="honeypot-field" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
              </div>

              <div>
                <FieldLabel htmlFor="fullName">{t('travelRequest.fullName')}</FieldLabel>
                <Input id="fullName" invalid={Boolean(errors.fullName)} {...register('fullName')} />
                <FieldError>{errors.fullName && t(errors.fullName.message ?? 'validation.required', { count: 2 })}</FieldError>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="email">{t('travelRequest.email')}</FieldLabel>
                  <Input id="email" type="email" invalid={Boolean(errors.email)} {...register('email')} />
                  <FieldError>{errors.email && t(errors.email.message ?? 'validation.invalidEmail')}</FieldError>
                </div>
                <div>
                  <FieldLabel htmlFor="phone">{t('travelRequest.phone')}</FieldLabel>
                  <div
                    className={cn(
                      'flex w-full items-center rounded-lg border border-text/15 bg-elevated pl-4 transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20',
                      errors.phone && 'border-danger focus-within:border-danger focus-within:ring-danger/20',
                    )}
                  >
                    <span className="select-none text-text/60">+992</span>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      maxLength={9}
                      placeholder="901234567"
                      className="w-full bg-transparent px-2 py-2.5 text-text outline-none placeholder:text-slate/50"
                      {...register('phone')}
                    />
                  </div>
                  <FieldError>{errors.phone && t(errors.phone.message ?? 'validation.invalidPhone')}</FieldError>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="departureDate">{t('travelRequest.departureDate')}</FieldLabel>
                  <Input id="departureDate" type="date" min={todayIso()} invalid={Boolean(errors.departureDate)} {...register('departureDate')} />
                  <FieldError>{errors.departureDate && t(errors.departureDate.message ?? 'validation.required')}</FieldError>
                </div>
                <div>
                  <FieldLabel htmlFor="returnDate">{t('travelRequest.returnDate')}</FieldLabel>
                  <Input
                    id="returnDate"
                    type="date"
                    min={departureDate || todayIso()}
                    invalid={Boolean(errors.returnDate)}
                    {...register('returnDate')}
                  />
                  <FieldError>{errors.returnDate && t(errors.returnDate.message ?? 'validation.returnBeforeDeparture')}</FieldError>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="destinationId">{t('travelRequest.destination')}</FieldLabel>
                  <Select id="destinationId" {...register('destinationId')}>
                    <option value="">{t('travelRequest.none')}</option>
                    {destinations.data?.items.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <FieldLabel htmlFor="offerId">{t('travelRequest.offer')}</FieldLabel>
                  <Select id="offerId" {...register('offerId')}>
                    <option value="">{t('travelRequest.none')}</option>
                    {offers.data?.items.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.title}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="passengersAdults">{t('travelRequest.adults')}</FieldLabel>
                  <Input
                    id="passengersAdults"
                    type="number"
                    min={1}
                    max={MAX_PASSENGERS}
                    invalid={Boolean(errors.passengersAdults)}
                    {...register('passengersAdults', { valueAsNumber: true })}
                  />
                  <FieldError>
                    {errors.passengersAdults && t(errors.passengersAdults.message ?? 'validation.min0', { count: MAX_PASSENGERS })}
                  </FieldError>
                </div>
                <div>
                  <FieldLabel htmlFor="passengersChildren">{t('travelRequest.children')}</FieldLabel>
                  <Input
                    id="passengersChildren"
                    type="number"
                    min={0}
                    max={MAX_PASSENGERS}
                    invalid={Boolean(errors.passengersChildren)}
                    {...register('passengersChildren', { valueAsNumber: true })}
                  />
                  <FieldError>
                    {errors.passengersChildren && t(errors.passengersChildren.message ?? 'validation.min0', { count: MAX_PASSENGERS })}
                  </FieldError>
                </div>
              </div>

              {childrenCount > 0 && (
                <div className="rounded-lg border border-text/10 bg-brand-subtle/40 p-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {Array.from({ length: childrenCount }).map((_, i) => (
                      <div key={i}>
                        <FieldLabel htmlFor={`childAge-${i}`}>{t('travelRequest.childAge', { index: i + 1 })}</FieldLabel>
                        <Select id={`childAge-${i}`} {...register(`childrenAges.${i}` as const, { valueAsNumber: true })}>
                          {Array.from({ length: 18 }).map((_, age) => (
                            <option key={age} value={age}>
                              {age}
                            </option>
                          ))}
                        </Select>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate">{t('travelRequest.childAgeHint')}</p>
                  <FieldError>{errors.childrenAges && !Array.isArray(errors.childrenAges) && t('validation.childAgeRequired')}</FieldError>
                </div>
              )}

              <div>
                <FieldLabel htmlFor="message">{t('travelRequest.message')}</FieldLabel>
                <Textarea id="message" placeholder={t('travelRequest.messagePlaceholder')} {...register('message')} />
              </div>

              <div>
                <FieldLabel>{t('travelRequest.passportPhoto')}</FieldLabel>
                <p className="mb-3 text-xs text-slate">{t('travelRequest.passportPhotoHint')}</p>
                <div className="flex flex-wrap gap-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-text/15 bg-elevated">
                      {photo.previewUrl && <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />}
                      {photo.status === 'uploading' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-dark/50 text-white">
                          <Loader2 size={20} className="animate-spin" />
                        </div>
                      )}
                      {photo.status === 'error' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-danger/10 p-1 text-center text-[10px] leading-tight text-danger">
                          {t(photo.errorKey ?? 'validation.uploadFailed')}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        aria-label={t('travelRequest.passportPhotoRemove')}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-dark/70 text-white hover:bg-dark"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {photos.length < MAX_PASSPORT_PHOTOS && (
                    <label className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-text/20 text-slate transition-colors hover:border-brand hover:text-brand">
                      <Upload size={18} />
                      <span className="text-[11px]">{t('travelRequest.passportPhotoAdd')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          addPhotoFiles(e.target.files)
                          e.target.value = ''
                        }}
                      />
                    </label>
                  )}
                </div>
                <FieldError>{showPassportPhotoRequiredError && t('validation.passportPhotoRequired')}</FieldError>
              </div>

              <label className="flex items-start gap-2 text-sm text-slate">
                <input type="checkbox" className="mt-0.5" {...register('consentAccepted')} />
                {t('travelRequest.consent')}
              </label>
              <FieldError>{errors.consentAccepted && t('validation.consentRequired')}</FieldError>

              <label className="flex items-start gap-2 text-sm text-slate">
                <input type="checkbox" className="mt-0.5" {...register('passportConsentAccepted')} />
                {t('travelRequest.passportConsent')}
              </label>
              <FieldError>{errors.passportConsentAccepted && t('validation.passportConsentRequired')}</FieldError>

              {mutation.isError && (
                <p className="text-sm text-danger">
                  {t('travelRequest.errorTitle')}: {publicErrorMessage(t, mutation.error as ApiError)}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending || hasUploadingPhoto}>
                {mutation.isPending ? t('travelRequest.submitting') : t('travelRequest.submit')}
              </Button>
            </form>
          )}
        </Card>
      </div>
      </Section>
    </>
  )
}
