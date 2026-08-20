import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches unhandled render/lifecycle errors anywhere under the admin section and shows a
 * recoverable screen instead of the blank white page React leaves behind by default (see
 * docs/PROGRESS.md — that's exactly how the DestinationFormPage crash first presented: no
 * message, no way out except a manual URL edit). This is a safety net for the *next* bug of this
 * class, not a substitute for fixing the DTO/type mismatches that cause them.
 */
export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Admin UI crashed:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
          <AlertTriangle size={32} className="text-danger" strokeWidth={1.5} />
          <div>
            <h1 className="text-lg font-medium">Что-то пошло не так</h1>
            <p className="mt-1 max-w-sm text-sm text-slate">
              Эта страница администратора столкнулась с непредвиденной ошибкой. Попробуйте вернуться назад или
              обновить страницу.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => window.history.back()}>
              Назад
            </Button>
            <Button onClick={() => window.location.assign('/admin')}>На дашборд</Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
