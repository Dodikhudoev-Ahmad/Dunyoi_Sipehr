import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-text/8 bg-elevated/70 shadow-[0_1px_2px_rgba(11,15,20,0.04),0_8px_24px_rgba(11,15,20,0.06)]',
        className,
      )}
      {...props}
    />
  )
}
