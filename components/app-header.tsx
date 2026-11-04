'use client'

import { Boxes, ClipboardList, LayoutGrid, Package, Truck, Users, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/auth-actions'
import type { CurrentUser } from '@/lib/auth/session'
import { cn } from '@/lib/utils'

const ADMIN_NAV = [
  { href: '/', label: 'لوحة التحكم', icon: LayoutGrid },
  { href: '/orders', label: 'الطلبات', icon: Package },
  { href: '/shipping', label: 'إدارة الشحن', icon: Truck },
  { href: '/inventory', label: 'المخزون والموديلات', icon: Boxes },
  { href: '/delivery-sheet', label: 'كشف التوصيل اليومي', icon: ClipboardList },
  { href: '/users', label: 'المستخدمون', icon: Users },
]

const STAFF_NAV = [
  { href: '/orders', label: 'الطلبات', icon: Package },
  { href: '/delivery-sheet', label: 'كشف التوصيل اليومي', icon: ClipboardList },
]

export function AppHeader({ user, activeCouriers }: { user: CurrentUser; activeCouriers: number }) {
  const pathname = usePathname()
  const nav = user.role === 'admin' ? ADMIN_NAV : STAFF_NAV
  const home = user.role === 'admin' ? '/' : '/orders'

  return (
    <header className="border-b border-border bg-background/95">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 pt-4 md:px-6">
        <Link href={home} className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full border border-primary/40 bg-primary/5 text-lg font-bold text-primary" aria-hidden="true">ع</span>
          <span className="flex flex-col">
            <span className="text-lg font-bold leading-tight text-primary">العنود للزي الشرعي</span>
            <span className="text-xs text-muted-foreground">نظام الطلبات والمخزون والتوصيل</span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
            {user.username} · {user.role === 'admin' ? 'مدير' : 'موظف'}
          </span>
          {user.role === 'admin' ? (
            <Link href="/shipping" className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              <span className={cn('size-2 rounded-full', activeCouriers > 0 ? 'bg-success' : 'bg-muted-foreground')} aria-hidden="true" />
              {activeCouriers > 0 ? `${activeCouriers} شركة توصيل مفعّلة` : 'لا توجد شركة توصيل'}
            </Link>
          ) : null}
          <form action={logoutAction}>
            <button type="submit" className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              <LogOut className="size-3.5" aria-hidden="true" /> تسجيل الخروج
            </button>
          </form>
        </div>
      </div>
      <nav aria-label="التنقل الرئيسي" className="mx-auto mt-3 max-w-7xl overflow-x-auto px-2 md:px-4">
        <ul className="flex min-w-max items-center">
          {nav.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors',
                    active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
