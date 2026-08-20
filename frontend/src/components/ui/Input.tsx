import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function FieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-sm font-medium text-slate', className)} {...props} />
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null
  return <p className="mt-1 text-sm text-danger">{children}</p>
}

const baseFieldClasses =
  'w-full rounded-lg border border-text/15 bg-elevated px-4 py-2.5 text-text placeholder:text-slate/50 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(baseFieldClasses, invalid && 'border-danger focus:border-danger focus:ring-danger/20', className)}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(baseFieldClasses, 'min-h-32 resize-y', invalid && 'border-danger focus:border-danger focus:ring-danger/20', className)}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  ({ className, invalid, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(baseFieldClasses, invalid && 'border-danger focus:border-danger focus:ring-danger/20', className)}
      {...props}
    >
      {children}
    </select>
  ),
)
Select.displayName = 'Select'
