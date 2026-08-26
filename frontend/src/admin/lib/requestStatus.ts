import type { TravelRequestStatus } from '@/types/domain'

/**
 * Единый источник правды для CRM-воронки заявок.
 * Раньше статусы показывались по-английски ("New", "Won"...) — тут переводим их
 * на русский и задаём цвета, чтобы вся админка (список, карточка, CRM-доска)
 * выглядела одинаково и на одном языке.
 */

// Порядок колонок в воронке — слева (новая заявка) направо (сделка закрыта).
export const STATUS_ORDER: TravelRequestStatus[] = ['New', 'Contacted', 'Qualified', 'Won', 'Lost']

// Русское название каждого статуса — то, что видит менеджер.
export const STATUS_LABEL: Record<TravelRequestStatus, string> = {
  New: 'Новая',
  Contacted: 'Связались',
  Qualified: 'Обсуждаем',
  Won: 'Успех',
  Lost: 'Отказ',
}

// Цветовой тон статуса (совпадает с тонами компонента Badge).
export const STATUS_TONE: Record<TravelRequestStatus, 'brand' | 'warning' | 'accent' | 'success' | 'danger'> = {
  New: 'brand',
  Contacted: 'warning',
  Qualified: 'accent',
  Won: 'success',
  Lost: 'danger',
}

// Цвет полоски-акцента вверху колонки на доске (обычный CSS-класс фона).
export const STATUS_ACCENT: Record<TravelRequestStatus, string> = {
  New: 'bg-brand',
  Contacted: 'bg-warning',
  Qualified: 'bg-brand-accent',
  Won: 'bg-success',
  Lost: 'bg-danger',
}
