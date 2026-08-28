import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  /** Accessible name for the dialog (aria-label). */
  label: string
  title?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * Centered dialog — same mechanics as `Drawer` (Escape-to-close, overlay-click-to-close, body
 * scroll locking, portaled to `<body>` so it's immune to any ancestor establishing a containing
 * block for fixed descendants), just a centered panel instead of a slide-in-from-edge one. Used
 * for admin CRUD dialogs (add staff, reset password, deal-value gate) — the public site has no
 * equivalent need yet.
 */
export function Modal({ open, onClose, label, title, className, children }: ModalProps) {
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={label}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'w-full max-w-md rounded-2xl border border-text/8 bg-elevated p-6 shadow-[0_1px_2px_rgba(11,15,20,0.04),0_8px_24px_rgba(11,15,20,0.06)]',
                className,
              )}
            >
              {title && (
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-lg font-medium">{title}</h2>
                  <button
                    onClick={onClose}
                    aria-label="Закрыть"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate hover:bg-text/5 hover:text-text"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
