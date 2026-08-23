import { z } from 'zod'

/** Today as an ISO date string (YYYY-MM-DD), for both the date-input `min` attribute and the
 * "not in the past" validation rule — matches the server's `DateOnly.FromDateTime(DateTime.UtcNow)`
 * check byte-for-byte since both compare plain calendar dates, no time/timezone component. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export const MAX_PASSENGERS = 9
export const MAX_CHILD_AGE = 17
export const MAX_PASSPORT_PHOTOS = 2

/**
 * Travel Request form schema (React Hook Form + Zod per CLAUDE.md / MASTER_TZ), mirroring
 * `CreateTravelRequestCommandValidator` on the backend field-for-field. `website` is the
 * honeypot field: real users never see or fill it, so any non-empty value gets rejected
 * client-side too (defense in depth; the authoritative check happens server-side).
 *
 * Passport photos are deliberately NOT part of this schema — they're uploaded eagerly (one
 * request per file) before the form is submitted, so the page tracks their upload state itself
 * and blocks submission if none succeeded yet, rather than modeling File objects in Zod/RHF.
 */
export const travelRequestSchema = z
  .object({
    lastName: z.string().trim().min(2, { message: 'validation.minLength' }),
    firstName: z.string().trim().min(2, { message: 'validation.minLength' }),
    /** Patronymic — optional (not every name convention has one, notably outside the ru locale);
     * mirrors CreateTravelRequestCommandValidator's MiddleName rule (MaximumLength only) exactly. */
    middleName: z.string().trim().max(200).optional(),
    /** Only the 9 digits after the fixed +992 prefix — the prefix itself is rendered in the UI
     * and never part of this field's value (see PhoneInput in TravelRequestPage). */
    phone: z.string().trim().regex(/^\d{9}$/, { message: 'validation.invalidPhone' }),
    destinationId: z.string().optional(),
    offerId: z.string().optional(),
    departureDate: z.string().min(1, { message: 'validation.required' }),
    returnDate: z.string().optional(),
    passengersAdults: z.number().int().min(1, { message: 'validation.min0' }).max(MAX_PASSENGERS, { message: 'validation.maxPassengers' }),
    passengersChildren: z.number().int().min(0, { message: 'validation.min0' }).max(MAX_PASSENGERS, { message: 'validation.maxPassengers' }),
    childrenAges: z.array(z.number().int().min(0).max(MAX_CHILD_AGE, { message: 'validation.invalidChildAge' })),
    message: z.string().trim().max(500).optional(),
    consentAccepted: z.literal(true, { message: 'validation.consentRequired' }),
    passportConsentAccepted: z.literal(true, { message: 'validation.passportConsentRequired' }),
    website: z.string().max(0).optional(),
  })
  .refine((data) => data.departureDate >= todayIso(), {
    message: 'validation.dateInPast',
    path: ['departureDate'],
  })
  .refine((data) => !data.returnDate || data.returnDate >= data.departureDate, {
    message: 'validation.returnBeforeDeparture',
    path: ['returnDate'],
  })
  .refine((data) => data.childrenAges.length === data.passengersChildren, {
    message: 'validation.childAgeRequired',
    path: ['childrenAges'],
  })

export type TravelRequestFormValues = z.infer<typeof travelRequestSchema>
