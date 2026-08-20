import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTranslation } from 'react-i18next'

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-danger/20 bg-danger/5 py-16 text-center">
      <AlertTriangle size={28} strokeWidth={1.5} className="text-danger" />
      <p className="text-slate">{message ?? t('common.error')}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
