import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** React Router doesn't reset scroll position on navigation (it's a SPA — the browser has no
 * reason to know a "page" changed), so without this every route change lands wherever the
 * previous page's scroll happened to be, often mid-footer. Renders nothing; just watches the
 * pathname and jumps to the top on every change. Mounted once inside <BrowserRouter>, above
 * <Routes>, so it applies to every route (public and admin) rather than needing per-page wiring. */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
