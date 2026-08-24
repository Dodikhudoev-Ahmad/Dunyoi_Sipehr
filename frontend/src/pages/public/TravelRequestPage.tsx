import { useEffect, useState, forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { Check, CheckCircle2, Upload, X, Loader2 } from 'lucide-react'
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
import { FieldLabel, FieldError, Input, Select } from '@/components/ui/Input'
import { Seo } from '@/components/seo/Seo'
import { pageTitle } from '@/lib/seo'
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

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  invalid?: boolean
}

/**
 * A Material-style "outlined" text field: empty + unfocused, the label sits centered inside the
 * field like a placeholder; on focus or once there's a value, it shrinks and rises to sit ON the
 * top border line, with an opaque background matching the field fill (`bg-elevated`) painted
 * behind it — since the label renders after the input in the DOM, that background paints over
 * the border segment directly behind the label, visually "notching" the border open around the
 * text (the standard notched-outline illusion, no SVG/fieldset-legend trickery needed).
 *
 * Pure CSS (Tailwind's `peer` + the `:placeholder-shown` pseudo-class via a single-space
 * placeholder) — no extra state, works unmodified with react-hook-form's uncontrolled
 * `register()` inputs. The label's x-position never moves (only `top` + `scale`), so it can never
 * collide with typed content, which lives inside the box below the notch line, not behind it.
 *
 * Page-local to TravelRequestPage: the shared `Input`/`FieldLabel` in components/ui/Input.tsx
 * (used by every other form, admin included) is untouched.
 */
const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(function FloatingInput(
  { label, invalid, id, className, ...props },
  ref,
) {
  return (
    <div className="relative">
      <input
        ref={ref}
        id={id}
        placeholder=" "
        className={cn(
          'peer w-full rounded-lg border border-text/15 bg-elevated px-4 py-3 text-text outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20',
          invalid && 'border-danger focus:border-danger focus:ring-danger/20',
          className,
        )}
        {...props}
      />
      <label
        htmlFor={id}
        className={cn(
          'pointer-events-none absolute left-4 top-1/2 z-10 origin-left -translate-y-1/2 scale-100 rounded px-1 text-[15px] text-slate/70 transition-all duration-150',
          'peer-focus:top-0 peer-focus:scale-75 peer-focus:bg-elevated peer-focus:text-brand',
          'peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:scale-75 peer-not-placeholder-shown:bg-elevated',
          invalid && 'peer-focus:text-danger',
        )}
      >
        {label}
      </label>
    </div>
  )
})

interface FloatingTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

/** Same notched-outline treatment as `FloatingInput`, adapted for a multi-line field: the resting
 * label sits at the top-left (a tall empty box centering it mid-height would look odd) rather
 * than vertically centered, so it only needs a short rise — not a rise from mid-box — to reach
 * the notch line. */
const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(function FloatingTextarea(
  { label, id, className, ...props },
  ref,
) {
  return (
    <div className="relative">
      <textarea
        ref={ref}
        id={id}
        placeholder=" "
        rows={4}
        className={cn(
          'peer w-full resize-y rounded-lg border border-text/15 bg-elevated px-4 pb-2.5 pt-6 text-text outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20',
          className,
        )}
        {...props}
      />
      <label
        htmlFor={id}
        className={cn(
          'pointer-events-none absolute left-4 top-4 z-10 origin-left translate-y-0 scale-100 rounded px-1 text-[15px] text-slate/70 transition-all duration-150',
          'peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-75 peer-focus:bg-elevated peer-focus:text-brand',
          'peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:scale-75 peer-not-placeholder-shown:bg-elevated',
        )}
      >
        {label}
      </label>
    </div>
  )
})

/** A styled checkbox: the real `<input type="checkbox">` stays in the DOM, full-size and
 * interactive (opacity-0, layered over the visual square) so keyboard nav, screen readers, and
 * react-hook-form's `register()` all work exactly as with a native checkbox — only the paint
 * layer is custom. The box and the checkmark are both direct siblings of the input (Tailwind's
 * `peer` selector only matches siblings, not descendants of a sibling), each independently
 * toggled by `peer-checked:`. */
const CustomCheckbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function CustomCheckbox(
  { className, ...props },
  ref,
) {
  return (
    <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0">
      <input
        ref={ref}
        type="checkbox"
        className={cn('peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0', className)}
        {...props}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-md border border-text/15 bg-elevated transition-colors peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/20"
      />
      <Check
        size={14}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 m-auto text-white opacity-0 transition-opacity peer-checked:opacity-100"
      />
    </span>
  )
})

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
      lastName: '',
      firstName: '',
      middleName: '',
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

  // The ?destinationId=/?offerId= URL params are only usable once the matching <option> actually
  // exists in the <Select> — destinations/offers load asynchronously, so at the moment useForm's
  // defaultValues run (synchronously, on first render) the list is still empty and the browser
  // has nothing to select, silently falling back to "Не выбрано". Once each query resolves,
  // re-apply the value from the URL — but only if it's actually one of the loaded options, so a
  // stale/invalid id in the URL doesn't get force-set into the field.
  useEffect(() => {
    const destinationId = searchParams.get('destinationId')
    if (destinationId && destinations.data?.items.some((d) => d.id === destinationId)) {
      setValue('destinationId', destinationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinations.data])

  useEffect(() => {
    const offerId = searchParams.get('offerId')
    if (offerId && offers.data?.items.some((o) => o.id === offerId)) {
      setValue('offerId', offerId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers.data])

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
        lastName: values.lastName,
        firstName: values.firstName,
        middleName: values.middleName || undefined,
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
      <Seo title={pageTitle(t('travelRequest.title'))} path="/travel-request" />
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

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <FloatingInput id="lastName" label={t('travelRequest.lastName')} invalid={Boolean(errors.lastName)} {...register('lastName')} />
                  <FieldError>{errors.lastName && t(errors.lastName.message ?? 'validation.required', { count: 2 })}</FieldError>
                </div>
                <div>
                  <FloatingInput id="firstName" label={t('travelRequest.firstName')} invalid={Boolean(errors.firstName)} {...register('firstName')} />
                  <FieldError>{errors.firstName && t(errors.firstName.message ?? 'validation.required', { count: 2 })}</FieldError>
                </div>
                <div>
                  <FloatingInput id="middleName" label={t('travelRequest.middleName')} invalid={Boolean(errors.middleName)} {...register('middleName')} />
                  <FieldError>{errors.middleName && t(errors.middleName.message ?? 'validation.maxLength', { count: 200 })}</FieldError>
                </div>
              </div>

              <div>
                {/* Notched-outline phone field: the "+992" prefix lives INSIDE the box on the same
                    baseline as the typed digits and only takes up space once the field is active
                    (focused or has a value) — at rest, only the floating "Телефон" label shows,
                    centered like a normal placeholder, with no prefix competing for the same
                    space. The label itself never sits near "+992" at all: once floated, it rises
                    to the border-notch position (like every other field here), well above the
                    input's own content line, so the two can never overlap or sit at mismatched
                    heights. */}
                <div className="group relative">
                  <div
                    className={cn(
                      'flex w-full items-center rounded-lg border border-text/15 bg-elevated px-4 py-3 transition-colors has-[input:focus]:border-brand has-[input:focus]:ring-2 has-[input:focus]:ring-brand/20',
                      errors.phone && 'border-danger has-[input:focus]:border-danger has-[input:focus]:ring-danger/20',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block max-w-0 shrink-0 select-none overflow-hidden whitespace-nowrap text-text opacity-0 transition-all duration-150 group-has-[input:focus]:max-w-14 group-has-[input:focus]:pr-2 group-has-[input:focus]:opacity-100 group-has-[input:not(:placeholder-shown)]:max-w-14 group-has-[input:not(:placeholder-shown)]:pr-2 group-has-[input:not(:placeholder-shown)]:opacity-100"
                    >
                      +992
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      maxLength={9}
                      placeholder=" "
                      className="peer w-full bg-transparent text-text outline-none"
                      {...register('phone')}
                    />
                  </div>
                  <label
                    htmlFor="phone"
                    className={cn(
                      'pointer-events-none absolute left-4 top-1/2 z-10 origin-left -translate-y-1/2 scale-100 rounded px-1 text-[15px] text-slate/70 transition-all duration-150',
                      'group-has-[input:focus]:top-0 group-has-[input:focus]:scale-75 group-has-[input:focus]:bg-elevated group-has-[input:focus]:text-brand',
                      'group-has-[input:not(:placeholder-shown)]:top-0 group-has-[input:not(:placeholder-shown)]:scale-75 group-has-[input:not(:placeholder-shown)]:bg-elevated',
                      errors.phone && 'group-has-[input:focus]:text-danger',
                    )}
                  >
                    {t('travelRequest.phone')}
                  </label>
                </div>
                <FieldError>{errors.phone && t(errors.phone.message ?? 'validation.invalidPhone')}</FieldError>
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
                <FloatingTextarea id="message" label={t('travelRequest.message')} {...register('message')} />
                <p className="mt-1.5 text-xs text-slate">{t('travelRequest.messagePlaceholder')}</p>
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

              <label className="flex items-start gap-2.5 text-sm text-slate">
                <CustomCheckbox {...register('consentAccepted')} />
                {t('travelRequest.consent')}
              </label>
              <FieldError>{errors.consentAccepted && t('validation.consentRequired')}</FieldError>

              <label className="flex items-start gap-2.5 text-sm text-slate">
                <CustomCheckbox {...register('passportConsentAccepted')} />
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
