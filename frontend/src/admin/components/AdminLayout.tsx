import { useState, type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Globe2,
  MapPinned,
  Wrench,
  Tag,
  MessageSquareQuote,
  HelpCircle,
  FileText,
  Inbox,
  ScrollText,
  KanbanSquare,
  Users,
  Crown,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAdminLogout, useAdminSession } from '@/admin/hooks/useAdminAuth'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Drawer } from '@/components/ui/Drawer'
import { cn } from '@/lib/cn'
import logo from '@/assets/brand/logo.png'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  /** Разделы управления контентом сайта — их видит только SuperAdmin.
   *  CRM-менеджер (роль Editor) работает только с заявками и воронкой. */
  superAdminOnly?: boolean
}

const NAV: NavItem[] = [
  { to: '/admin', label: 'Дашборд', icon: LayoutDashboard, end: true },
  { to: '/admin/crm', label: 'CRM — воронка', icon: KanbanSquare },
  { to: '/admin/travel-requests', label: 'Заявки', icon: Inbox },
  { to: '/admin/destinations', label: 'Направления', icon: MapPinned, superAdminOnly: true },
  { to: '/admin/offers', label: 'Предложения', icon: Tag, superAdminOnly: true },
  { to: '/admin/services', label: 'Услуги', icon: Wrench, superAdminOnly: true },
  { to: '/admin/countries-cities', label: 'Страны и города', icon: Globe2, superAdminOnly: true },
  { to: '/admin/testimonials', label: 'Отзывы', icon: MessageSquareQuote, superAdminOnly: true },
  { to: '/admin/faq', label: 'Вопросы', icon: HelpCircle, superAdminOnly: true },
  { to: '/admin/site-content', label: 'Контент сайта', icon: FileText, superAdminOnly: true },
  { to: '/admin/staff', label: 'Сотрудники', icon: Users, superAdminOnly: true },
  { to: '/admin/audit-log', label: 'Журнал аудита', icon: ScrollText, superAdminOnly: true },
]

interface SidebarContentProps {
  admin: ReturnType<typeof useAdminSession>['admin']
  onLogout: () => void
  onNavigate?: () => void
  headerExtra?: ReactNode
}

/** Shared nav/profile markup for the static desktop sidebar and the mobile drawer — kept in one
 * place so the two surfaces can't drift out of sync with each other. */
function SidebarContent({ admin, onLogout, onNavigate, headerExtra }: SidebarContentProps) {
  // CRM-менеджеру (роль Editor) показываем только Дашборд, CRM и Заявки.
  // SuperAdmin видит все разделы, включая управление контентом сайта.
  const navItems = NAV.filter((item) => !item.superAdminOnly || admin?.role === 'SuperAdmin')
  return (
    <>
      <div className="flex shrink-0 items-center gap-2.5 px-6 py-6 font-display text-lg">
        <img src={logo} alt="" aria-hidden className="h-8 w-8 shrink-0 object-contain" /> Dunyoi Sipehr
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/60">Admin</span>
        {headerExtra}
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white',
                isActive && 'bg-white/10 text-white',
              )
            }
          >
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="shrink-0 border-t border-white/10 px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="truncate text-sm">{admin?.displayName ?? admin?.email}</p>
          <ThemeToggle dark />
        </div>
        {admin?.role === 'SuperAdmin' ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-dark"
            style={{ background: 'linear-gradient(135deg, var(--color-gold) 0%, #e8c976 50%, var(--color-gold) 100%)' }}
          >
            <Crown size={11} strokeWidth={2.5} /> SuperAdmin
          </span>
        ) : (
          <p className="text-xs text-white/50">{admin?.role}</p>
        )}
        <button
          onClick={onLogout}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
        >
          <LogOut size={15} /> Выйти
        </button>
      </div>
    </>
  )
}

export function AdminLayout() {
  const { admin } = useAdminSession()
  const logout = useAdminLogout()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-paper text-text">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-ink text-white md:flex">
        <SidebarContent admin={admin} onLogout={() => logout.mutate()} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-white/10 bg-ink px-4 py-3 text-white md:hidden">
          <div className="flex items-center gap-2.5 font-display text-base">
            <img src={logo} alt="" aria-hidden className="h-7 w-7 shrink-0 object-contain" /> Dunyoi Sipehr
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Открыть меню"
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Menu size={22} />
          </button>
        </div>

        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-6xl px-5 py-8 md:px-10">
            <Outlet />
          </div>
        </main>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} side="left" label="Меню администратора" panelClassName="bg-ink text-white">
        <SidebarContent
          admin={admin}
          onLogout={() => {
            setOpen(false)
            logout.mutate()
          }}
          onNavigate={() => setOpen(false)}
          headerExtra={
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Закрыть меню"
              className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          }
        />
      </Drawer>
    </div>
  )
}
