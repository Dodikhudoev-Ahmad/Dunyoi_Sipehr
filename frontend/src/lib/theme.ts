export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

/** Mirrors the inline pre-paint script in index.html — keep the two in sync. Defaults to dark
 * when there's no stored preference, regardless of system color scheme. */
export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(STORAGE_KEY, theme)
}
