import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Tooltip } from './Tooltip'

type Tone = 'neutral' | 'danger'

// Same hover-fill convention as the CRM board's arrow buttons (rounded-md, transition-colors,
// hover:bg-brand-subtle hover:text-brand -- see CrmBoardPage.tsx) and the danger styling used on
// every row-level delete trigger (text-danger hover:bg-danger/10) that opens DeleteConfirmModal.
const toneClasses: Record<Tone, string> = {
  neutral: 'text-slate hover:bg-brand-subtle hover:text-brand',
  danger: 'text-danger hover:bg-danger/10',
}

interface IconActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Tooltip text and accessible name -- both come from the same string, so they can't drift apart. */
  label: string
  tone?: Tone
}

/** Single reusable action-column control: a small square icon button with a hover tooltip.
 * Used everywhere a list row has row-level actions (edit/delete/reset-password/etc.) so every
 * admin list page reads consistently instead of a mix of text links and bare icons. */
export const IconActionButton = forwardRef<HTMLButtonElement, IconActionButtonProps>(
  ({ label, tone = 'neutral', className, children, ...props }, ref) => (
    <Tooltip label={label}>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
          toneClasses[tone],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    </Tooltip>
  ),
)
IconActionButton.displayName = 'IconActionButton'
