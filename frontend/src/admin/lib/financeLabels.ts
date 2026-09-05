import type { ExpenseCategory, PaymentMethod } from '@/types/domain'

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  Cash: 'Наличные',
  Card: 'Карта',
  BankTransfer: 'Банковский перевод',
  Other: 'Другое',
}

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  Rent: 'Аренда',
  Salary: 'Зарплата',
  AirlineCommission: 'Комиссии авиакомпаниям',
  Advertising: 'Реклама',
  Other: 'Прочее',
}

/** Finance amounts are recorded in the agency's single operating currency (somoni) — see
 * backend/Domain/Entities/Finance.cs doc comment — so this is a fixed suffix, not a per-record
 * currency lookup like TravelRequest.dealCurrency elsewhere in the admin. */
export function formatMoney(amount: number): string {
  return `${amount.toLocaleString('ru', { maximumFractionDigits: 0 })} TJS`
}

export function categoryOrMethodLabel(type: 'Income' | 'Expense', value: string): string {
  if (type === 'Income') return PAYMENT_METHOD_LABEL[value as PaymentMethod] ?? value
  return EXPENSE_CATEGORY_LABEL[value as ExpenseCategory] ?? value
}
