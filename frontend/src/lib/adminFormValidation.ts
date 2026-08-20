/**
 * Minimal client-side mirrors of the FluentValidation rules on the matching backend command
 * (see backend/Application/Features/*​/Commands/*.cs) — small, composable checks rather than a
 * full react-hook-form/zod migration, since these admin CRUD pages are plain useState forms.
 * Each returns an error message (ru — admin UI is ru-only) or `undefined` when valid.
 */

export function requiredError(value: string, message = 'Обязательное поле'): string | undefined {
  return value.trim() ? undefined : message
}

export function maxLengthError(value: string, max: number): string | undefined {
  return value.length > max ? `Максимум ${max} символов` : undefined
}

export function exactLengthError(value: string, length: number): string | undefined {
  return value.trim().length === length ? undefined : `Ровно ${length} символа`
}

export function rangeError(value: number, min: number, max: number): string | undefined {
  return Number.isFinite(value) && value >= min && value <= max ? undefined : `Значение от ${min} до ${max}`
}

export function minError(value: number, min: number): string | undefined {
  return Number.isFinite(value) && value >= min ? undefined : `Не может быть меньше ${min}`
}

/** True when the errors record has at least one entry — the common submit-blocking guard. */
export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean)
}
