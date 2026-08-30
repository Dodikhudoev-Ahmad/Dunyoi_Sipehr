import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'excel'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover',
  secondary: 'bg-transparent text-text border border-text/20 hover:border-brand hover:text-brand',
  ghost: 'bg-transparent text-text hover:bg-brand-subtle hover:text-brand',
  // Excel-brand green (#217346, MS Office's own swatch) for the requests export button — kept
  // entirely out of the blue brand palette so hover/focus never drift toward the site's blue.
  excel: 'bg-[#217346] text-white hover:bg-[#1a5c38] focus-visible:ring-[#217346]/50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm px-4 py-2',
  md: 'text-base px-6 py-3',
  lg: 'text-base px-8 py-4',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-colors duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
