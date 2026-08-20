import type { TFunction } from 'i18next'
import { ApiError, type ApiErrorCode } from '@/types/api'

/** Admin UI is ru-only (MASTER_TZ §2 — internal tool, no localization for v1), so its error
 * copy is hardcoded ru text rather than routed through i18next like the public site. */
const ADMIN_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  VALIDATION_FAILED: 'проверьте правильность заполнения полей',
  NOT_FOUND: 'запись не найдена (возможно, уже удалена)',
  UNAUTHORIZED: 'сессия истекла, войдите заново',
  FORBIDDEN: 'недостаточно прав для этого действия',
  CONFLICT_DUPLICATE: 'такая запись уже существует',
  CONFLICT_HAS_CHILDREN: 'у записи есть связанные объекты — сначала удалите их',
  RATE_LIMITED: 'слишком много попыток, повторите позже',
  BOOTSTRAP_ALREADY_DONE: 'администратор уже создан',
  INVALID_CREDENTIALS: 'неверный e-mail или пароль',
  INVALID_REFRESH_TOKEN: 'сессия истекла, войдите заново',
  INVALID_TRANSITION: 'такой переход статуса недопустим',
  NETWORK_ERROR: 'сервер недоступен',
  UNKNOWN_ERROR: 'непредвиденная ошибка',
}

/**
 * Turns a caught error into a short ru reason clause for admin toasts, keyed off the backend's
 * stable RFC7807 `errorCode` rather than the raw (English) `ApiError.message` — the CMS is
 * ru-only, and showing the untranslated backend string is a localization bug, not a feature.
 */
export function adminErrorMessage(fallback: string, error: unknown): string {
  const code = error instanceof ApiError ? error.errorCode : 'UNKNOWN_ERROR'
  return `${fallback}: ${ADMIN_ERROR_MESSAGES[code]}`
}

/**
 * Public-site equivalent: resolves the errorCode against the active locale's `errors.*` keys
 * (ru/tg/en, see i18n/locales) instead of showing the backend's raw English message.
 */
export function publicErrorMessage(t: TFunction, error: unknown): string {
  const code = error instanceof ApiError ? error.errorCode : 'UNKNOWN_ERROR'
  return t(`errors.${code}`, { defaultValue: t('errors.UNKNOWN_ERROR') })
}
