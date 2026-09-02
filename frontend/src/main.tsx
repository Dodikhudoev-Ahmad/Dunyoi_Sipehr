import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts (see index.css --font-display/--font-sans) — bundled instead of fetched from
// Google Fonts so the page doesn't pay a render-blocking DNS+TLS+fetch round trip to a third-party
// origin. `opsz.css` keeps Bodoni Moda's optical-size axis (its display weight varies with size,
// same variable font Google was already serving); Golos Text ships as static per-weight files
// since the original request only ever pinned discrete weights, not a range.
import '@fontsource-variable/bodoni-moda/opsz.css'
import '@fontsource/golos-text/400.css'
import '@fontsource/golos-text/500.css'
import '@fontsource/golos-text/600.css'
import '@fontsource/golos-text/700.css'
import './index.css'
import '@/i18n'
import App from './App.tsx'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
