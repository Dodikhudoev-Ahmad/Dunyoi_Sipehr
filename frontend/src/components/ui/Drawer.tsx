import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/cn'

interface DrawerProps {
  open: boolean
  onClose: () => void
  /** Which edge the panel slides in from. */
  side?: 'left' | 'right'
  /** Accessible name for the dialog (aria-label). */
  label: string
  /** Classes for the sliding panel itself (background, text color, width, …) — the caller owns
   * the visual styling so this component stays reusable across the public site (adaptive light/
   * dark tokens) and the admin CMS (a fixed-dark panel). */
  panelClassName?: string
  children: ReactNode
}

/**
 * Shared slide-in drawer: dimmed overlay + an animated panel from one edge of the screen.
 * Handles Escape-to-close, overlay-click-to-close, and body scroll locking while open — used by
 * the public site's mobile nav (`Nav.tsx`) and the admin sidebar (`AdminLayout.tsx`) so both stay
 * in sync instead of each re-implementing the same open/close mechanics.
 */
export function Drawer({ open, onClose, side = 'left', label, panelClassName, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.documentElement.style.overflow = ''
    }
  }, [open, onClose])

  const closedX = side === 'left' ? '-100%' : '100%'

  // Portaled to <body>: keeps this fixed-position overlay/panel pair immune to any ancestor that
  // creates its own containing block for fixed descendants (backdrop-filter/filter/transform/
  // will-change) — e.g. the public site's header applies `backdrop-blur` while scrolled/open,
  // which otherwise silently shrinks the drawer down to the header's own height.
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
            className="fixed inset-0 z-40 bg-black/50"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ x: closedX }}
            animate={{ x: 0 }}
            exit={{ x: closedX }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'fixed inset-y-0 z-50 flex w-72 max-w-[80%] flex-col shadow-xl',
              side === 'left' ? 'left-0' : 'right-0',
              panelClassName,
            )}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
