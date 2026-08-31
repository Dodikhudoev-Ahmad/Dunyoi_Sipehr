import type { FlightStatus } from '@/types/domain'

export const FLIGHT_STATUS_ORDER: FlightStatus[] = ['Scheduled', 'Departed', 'Cancelled']

export const FLIGHT_STATUS_LABEL: Record<FlightStatus, string> = {
  Scheduled: 'Запланирован',
  Departed: 'Вылетел',
  Cancelled: 'Отменён',
}

export const FLIGHT_STATUS_TONE: Record<FlightStatus, 'brand' | 'success' | 'danger'> = {
  Scheduled: 'brand',
  Departed: 'success',
  Cancelled: 'danger',
}
