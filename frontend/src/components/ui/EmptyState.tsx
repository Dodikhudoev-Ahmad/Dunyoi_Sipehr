import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

export function EmptyState({ title, icon }: { title: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-text/15 py-16 text-center text-slate">
      {icon ?? <Inbox size={28} strokeWidth={1.5} className="text-slate/60" />}
      <p>{title}</p>
    </div>
  )
}
