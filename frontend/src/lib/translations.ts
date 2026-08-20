import type { Locale } from '@/types/domain'

/**
 * Finds the entry for `locale` in a `Translations` array returned by an admin GET-by-id endpoint.
 *
 * The backend serializes the `Locale` enum using the raw C# member name ("Ru"/"Tg"/"En" — see
 * `Domain/Enums/Locale.cs`, written with `new JsonStringEnumConverter()` and no naming policy in
 * `Program.cs`), not the app's lowercase locale codes ('ru'/'tg'/'en') used everywhere else
 * (routing, i18n, this `Locale` type). Verified live against a running backend:
 * `GET /admin/destinations/{id}` returns `"translations":[{"locale":"Ru",...}]`.
 *
 * A plain `t.locale === locale` comparison therefore never matches, on any record, in any admin
 * form — every "load an existing entity into the edit form" code path silently found nothing and
 * fell through to blank fields (or, for Destination's `highlights` array, crashed outright — see
 * docs/PROGRESS.md). Comparing case-insensitively fixes it at the one place it's consumed,
 * without touching the backend's already-tested, already-audited enum wire format.
 */
export function findTranslation<T extends { locale: string }>(
  translations: T[] | undefined,
  locale: Locale,
): T | undefined {
  return translations?.find((t) => t.locale.toLowerCase() === locale)
}
