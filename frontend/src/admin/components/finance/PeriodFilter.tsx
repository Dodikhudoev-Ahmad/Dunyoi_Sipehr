import { cn } from '@/lib/cn'
import { Input } from '@/components/ui/Input'

export type PeriodPreset = 'today' | 'week' | 'month' | 'custom'

export interface Period {
  preset: PeriodPreset
  fromDate: string
  toDate: string
}

/** Local (not UTC) yyyy-MM-dd — a plain `toISOString().slice(0, 10)` shifts the date near
 * midnight for any viewer west of UTC, silently dropping "today" out of a "today" filter. */
function toDateOnly(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function presetToRange(preset: PeriodPreset): { fromDate: string; toDate: string } {
  const today = new Date()
  const toDate = toDateOnly(today)
  switch (preset) {
    case 'today':
      return { fromDate: toDate, toDate }
    case 'week': {
      const from = new Date(today)
      from.setDate(from.getDate() - 6)
      return { fromDate: toDateOnly(from), toDate }
    }
    case 'month': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1)
      return { fromDate: toDateOnly(from), toDate }
    }
    case 'custom':
      return { fromDate: toDate, toDate }
  }
}

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
  { key: 'custom', label: 'Период' },
]

export function PeriodFilter({ period, onChange }: { period: Period; onChange: (period: Period) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-text/10 bg-elevated p-1">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange({ preset: p.key, ...presetToRange(p.key) })}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm transition-colors',
              period.preset === p.key ? 'bg-brand text-white' : 'text-slate hover:bg-brand-subtle hover:text-brand',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      {period.preset === 'custom' && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="С даты"
            value={period.fromDate}
            max={period.toDate}
            onChange={(e) => onChange({ ...period, fromDate: e.target.value })}
            className="w-auto"
          />
          <span className="text-slate">—</span>
          <Input
            type="date"
            aria-label="По дату"
            value={period.toDate}
            min={period.fromDate}
            onChange={(e) => onChange({ ...period, toDate: e.target.value })}
            className="w-auto"
          />
        </div>
      )}
    </div>
  )
}
