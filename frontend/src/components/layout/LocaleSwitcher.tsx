import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Globe, ChevronDown } from 'lucide-react'
import { LOCALES, type Locale } from '@/types/domain'
import { useLocale, localizedPath } from '@/i18n/LocaleContext'
import { cn } from '@/lib/cn'

const LABELS: Record<Locale, string> = { ru: 'RU', tg: 'TG', en: 'EN' }

/** Strips the current locale prefix from the pathname, leaving the bare route path. */
function stripLocalePrefix(pathname: string, locale: Locale): string {
  if (locale === 'ru') return pathname
  const prefix = `/${locale}`
  if (pathname === prefix) return '/'
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length)
  return pathname
}

interface LocaleSwitcherProps {
  dark?: boolean
  /** 'md' gives a 40px touch target for the mobile header bar; 'sm' (default) matches the compact desktop nav sizing. */
  size?: 'sm' | 'md'
}

export function LocaleSwitcher({ dark = false, size = 'sm' }: LocaleSwitcherProps) {
  const locale = useLocale()
  const location = useLocation()
  const navigate = useNavigate()
  const bare = stripLocalePrefix(location.pathname, locale)

  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (open) itemRefs.current[LOCALES.indexOf(locale)]?.focus()
  }, [open, locale])

  function selectLocale(l: Locale) {
    setOpen(false)
    triggerRef.current?.focus()
    if (l !== locale) navigate(localizedPath(l, bare))
  }

  function onMenuKeyDown(e: React.KeyboardEvent) {
    const currentIndex = itemRefs.current.findIndex((el) => el === document.activeElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      itemRefs.current[(currentIndex + 1) % LOCALES.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      itemRefs.current[(currentIndex - 1 + LOCALES.length) % LOCALES.length]?.focus()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(true)
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1.5 rounded-full border font-medium tracking-wide transition-colors',
          size === 'md' ? 'h-10 px-2.5 text-xs' : 'px-3 py-1.5 text-xs',
          dark
            ? 'border-brand-accent/30 text-white/70 hover:text-white'
            : 'border-brand/20 text-slate hover:text-brand',
        )}
      >
        <Globe size={14} aria-hidden />
        {LABELS[locale]}
        <ChevronDown size={12} aria-hidden className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Language"
          onKeyDown={onMenuKeyDown}
          className={cn(
            'absolute right-0 top-[calc(100%+8px)] z-50 min-w-28 overflow-hidden rounded-xl border py-1 shadow-lg',
            dark ? 'border-white/10 bg-ink' : 'border-text/10 bg-elevated',
          )}
        >
          {LOCALES.map((l, i) => (
            <button
              key={l}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              role="menuitem"
              type="button"
              aria-current={l === locale ? 'true' : undefined}
              onClick={() => selectLocale(l)}
              className={cn(
                'flex w-full items-center px-4 text-left font-medium transition-colors',
                size === 'md' ? 'h-10 text-sm' : 'py-2 text-sm',
                l === locale
                  ? dark
                    ? 'bg-brand-accent text-white'
                    : 'bg-brand text-white'
                  : dark
                    ? 'text-white/70 hover:bg-brand-accent/15 hover:text-white'
                    : 'text-slate hover:bg-brand-subtle hover:text-brand',
              )}
            >
              {LABELS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
