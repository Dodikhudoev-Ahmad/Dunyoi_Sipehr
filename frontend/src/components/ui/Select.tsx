import { Children, forwardRef, isValidElement, type OptionHTMLAttributes, type ReactNode } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { baseFieldClasses } from './Input'

// Radix forbids an empty-string item value (it's reserved to mean "cleared"), but callers
// commonly need one for a "— none —" / "all" option. Map "" to this sentinel at the boundary
// so the public API can keep behaving like a native <select value="">.
const EMPTY_VALUE = '__select-empty__'

interface OptionShape {
  value: string
  label: ReactNode
  disabled?: boolean
}

/** Reads plain <option> children (as used with a native <select>) into Radix items, so callers
 * don't need to rewrite their option lists to adopt the custom dropdown. */
function readOptions(children: ReactNode): OptionShape[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<OptionHTMLAttributes<HTMLOptionElement>>(child) || child.type !== 'option') return []
    const { value, children: label, disabled } = child.props
    if (value === undefined) return []
    return [{ value: String(value), label, disabled }]
  })
}

export interface SelectProps {
  /** Plain <option value="..."> elements — same shape as a native <select>'s children. */
  children: ReactNode
  value?: string
  defaultValue?: string
  /** Mimics a native <select>'s change event so existing `(e) => setX(e.target.value)` handlers
   * and react-hook-form's `field.onChange` work unchanged. */
  onChange?: (event: { target: { value: string; name?: string } }) => void
  onBlur?: () => void
  name?: string
  id?: string
  disabled?: boolean
  invalid?: boolean
  placeholder?: ReactNode
  className?: string
  'aria-label'?: string
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { children, value, defaultValue, onChange, onBlur, name, id, disabled, invalid, placeholder, className, ...aria },
  ref,
) {
  const options = readOptions(children)
  const toRadix = (v: string) => (v === '' ? EMPTY_VALUE : v)
  const fromRadix = (v: string) => (v === EMPTY_VALUE ? '' : v)

  return (
    <SelectPrimitive.Root
      value={value === undefined ? undefined : toRadix(value)}
      defaultValue={defaultValue === undefined ? undefined : toRadix(defaultValue)}
      onValueChange={(v) => onChange?.({ target: { value: fromRadix(v), name } })}
      disabled={disabled}
      name={name}
    >
      <SelectPrimitive.Trigger
        ref={ref}
        id={id}
        onBlur={onBlur}
        className={cn(
          baseFieldClasses,
          'flex min-h-11 items-center justify-between gap-2 text-left data-[placeholder]:text-slate/50',
          invalid && 'border-danger focus:border-danger focus:ring-danger/20',
          className,
        )}
        {...aria}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="shrink-0 text-slate">
          <ChevronDown size={16} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          // z-60: above Modal/Drawer's z-50, so a Select inside either (deal-value currency,
          // add-staff role) always renders its popover on top of that overlay.
          className="z-60 max-h-[min(24rem,var(--radix-select-content-available-height))] w-(--radix-select-trigger-width) overflow-hidden rounded-lg border border-text/10 bg-elevated text-text shadow-xl"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={toRadix(opt.value)}
                disabled={opt.disabled}
                className="relative flex min-h-11 cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm text-text outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-brand-subtle data-[highlighted]:text-brand data-[state=checked]:font-medium"
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="ml-auto flex items-center pl-2 text-brand">
                  <Check size={14} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
})
