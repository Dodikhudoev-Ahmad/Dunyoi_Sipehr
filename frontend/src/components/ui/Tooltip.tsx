import type { ReactNode } from 'react'

/** Hover/focus-only label for an icon-only control. Pure CSS (group-hover/group-focus-within) --
 * no positioning library needed for this simple "appears above the trigger" case. Decorative:
 * the trigger itself carries the real accessible name (e.g. aria-label), so this is aria-hidden. */
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  )
}
