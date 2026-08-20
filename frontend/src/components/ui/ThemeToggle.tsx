import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { applyTheme, type Theme } from '@/lib/theme'
import { cn } from '@/lib/cn'

function currentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

interface ThemeToggleProps {
  dark?: boolean
  /** 'md' gives a 40px touch target for the mobile header bar; 'sm' (default) matches the compact desktop nav sizing. */
  size?: 'sm' | 'md'
  className?: string
}

export function ThemeToggle({ dark = false, size = 'sm', className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(currentTheme)

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
      className={cn(
        'flex items-center justify-center rounded-full border transition-colors',
        size === 'md' ? 'h-10 w-10' : 'h-7 w-7',
        dark ? 'border-brand-accent/30 text-white/70 hover:text-white' : 'border-brand/20 text-slate hover:text-brand',
        className,
      )}
    >
      {theme === 'dark' ? <Sun size={size === 'md' ? 18 : 14} /> : <Moon size={size === 'md' ? 18 : 14} />}
    </button>
  )
}
