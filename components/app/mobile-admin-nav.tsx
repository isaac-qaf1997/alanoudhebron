'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Boxes, ClipboardList, LayoutDashboard, Truck, Package } from 'lucide-react'

const items = [
  { href: '/admin', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/orders', label: 'الطلبات', icon: Package },
  { href: '/inventory', label: 'المخزون', icon: Boxes },
  { href: '/shipping', label: 'الشحن', icon: Truck },
  { href: '/delivery-sheet', label: 'الكشف', icon: ClipboardList },
]

export function MobileAdminNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="تنقل تطبيق الإدارة" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dfd5c5] bg-[#fffdf9]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(35,25,15,0.08)] backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === href : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link href={href} prefetch={false} aria-current={active ? 'page' : undefined} className={`flex min-h-[62px] flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold transition-colors ${active ? 'text-[#91672f]' : 'text-[#8d8376]'}`}>
                <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
