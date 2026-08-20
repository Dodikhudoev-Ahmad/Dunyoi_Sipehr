import { LOCALES, type Locale } from '@/types/domain'
import { cn } from '@/lib/cn'

const LABELS: Record<Locale, string> = { ru: 'Русский', tg: 'Тоҷикӣ', en: 'English' }

export function LocaleTabs({ active, onChange }: { active: Locale; onChange: (locale: Locale) => void }) {
  return (
    <div className="mb-4 flex gap-1 rounded-lg bg-text/5 p-1">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={cn(
            'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            active === l ? 'bg-elevated text-text shadow-sm' : 'text-slate hover:text-text',
          )}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  )
}
