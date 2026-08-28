/** "2 часа назад" style relative-time label for the notes feed — small and ru-only (admin UI has
 * no localization, see MASTER_TZ.md §2), so a dependency like date-fns would be overkill for one
 * call site. Falls back to an absolute date once it's more than a week old, where "N дней назад"
 * stops being more useful than the actual date. */
export function relativeTimeRu(isoDate: string): string {
  const then = new Date(isoDate).getTime()
  const diffSeconds = Math.max(0, Math.floor((Date.now() - then) / 1000))

  if (diffSeconds < 60) return 'только что'

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} ${pluralRu(diffMinutes, 'минуту', 'минуты', 'минут')} назад`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} ${pluralRu(diffHours, 'час', 'часа', 'часов')} назад`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} ${pluralRu(diffDays, 'день', 'дня', 'дней')} назад`

  return new Date(isoDate).toLocaleString('ru')
}

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}
