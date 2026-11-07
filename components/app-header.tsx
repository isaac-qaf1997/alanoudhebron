'use client'

import { Boxes, ClipboardList, LayoutGrid, Package, Store, TicketPercent, Truck } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { CurrentUser } from '@/lib/auth/session'

const NAV = [
  { href: '/admin', label: 'لوحة التحكم', icon: LayoutGrid },
  { href: '/orders', label: 'الطلبات', icon: Package },
  { href: '/shipping', label: 'إدارة الشحن', icon: Truck },
  { href: '/inventory', label: 'المخزون والموديلات', icon: Boxes },
  { href: '/coupons', label: 'أكواد الخصم', icon: TicketPercent },
  { href: '/delivery-sheet', label: 'كشف التوصيل اليومي', icon: ClipboardList },
  { href: '/shop', label: 'المتجر', icon: Store },
]

export function AppHeader({ user, activeCouriers }: { user: CurrentUser; activeCouriers: number }) {
  const pathname = usePathname()
  const navItems = user.role === 'admin' ? NAV : NAV.filter((item) => item.href === '/orders' || item.href === '/delivery-sheet')

  return (
    <header className="border-b border-border bg-background/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 pt-4 md:px-6">
        <Link href={user.role === 'admin' ? '/admin' : '/orders'} className="flex items-center gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-full border border-primary/40 bg-primary/5 text-lg font-bold text-primary"
            aria-hidden="true"
          >
            {'ع'}
          </span>
          <span className="flex flex-col">
            <span className="text-lg font-bold leading-tight text-primary">العنود للزي الشرعي</span>
            <span className="text-xs text-muted-foreground">نظام المخزون والتوصيل</span>
          </span>
        </Link>
        {user.role === 'admin' ? <Link
          href="/shipping"
          className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <span
            className={cn('size-2 rounded-full', activeCouriers > 0 ? 'bg-success' : 'bg-muted-foreground')}
            aria-hidden="true"
          />
          {activeCouriers > 0 ? `${activeCouriers} شركة توصيل مفعّلة` : 'لا توجد شركة توصيل'}
        </Link> : null}
      </div>
      <nav aria-label="التنقل الرئيسي" className="mx-auto mt-3 max-w-7xl overflow-x-auto px-2 md:px-4">
        <ul className="flex min-w-max items-center">
          {navItems.map((item) => {
            const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors',
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
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
