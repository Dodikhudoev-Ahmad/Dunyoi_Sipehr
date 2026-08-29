import { useCallback, useEffect, useState } from 'react'

/** Tracks whether a horizontally-scrollable element has hidden content to the left/right,
 * so callers can show a fade hint instead of silently clipping content off-screen.
 *
 * Uses a callback ref (not a plain ref object) because on pages like the CRM board the
 * scrollable element doesn't exist on first render (a loading skeleton is shown instead) —
 * a plain ref's effect would have already run and found nothing to measure by the time the
 * real element mounts, and refs alone don't trigger effect re-runs when they attach later. */
export function useScrollShadow<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const ref = useCallback((el: T | null) => setNode(el), [])

  useEffect(() => {
    if (!node) return
    const update = () => {
      setCanScrollLeft(node.scrollLeft > 0)
      setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 1)
    }
    update()
    node.addEventListener('scroll', update, { passive: true })
    // Observes both the scroll container and its content: the container's own size rarely
    // changes, but its content's width does (e.g. more rows/columns loading in), which is
    // exactly when canScrollRight needs to be recomputed.
    const ro = new ResizeObserver(update)
    ro.observe(node)
    if (node.firstElementChild) ro.observe(node.firstElementChild)
    return () => {
      node.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [node])

  return { ref, canScrollLeft, canScrollRight }
}
