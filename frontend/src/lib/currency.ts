import type { TFunction } from 'i18next'
import type { Currency } from '@/types/domain'

/**
 * The API serializes the `Currency` enum using its C# member name (e.g. "Usd"),
 * while `common.currency_*` i18n keys are keyed by the uppercase ISO code
 * (e.g. "currency_USD") to match `Currency` in types/domain.ts. Normalize here
 * instead of assuming the two casings ever match.
 */
export function currencySymbol(t: TFunction, currency: Currency | string): string {
  return t(`common.currency_${currency.toUpperCase()}`)
}
