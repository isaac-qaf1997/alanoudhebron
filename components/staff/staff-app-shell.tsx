'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Home, Package, Store } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = { user: { username: string; role: 'admin' | 'staff' }; children: React.ReactNode }

const links = [
  { href: '/staff', label: 'الرئيسية', icon: Home },
  { href: '/staff/orders', label: 'الطلبات', icon: Package },
  { href: '/staff/delivery-sheet', label: 'كشف التوصيل', icon: ClipboardList },
]

export function StaffAppShell({ user, children }: Props) {
  const pathname = usePathname()

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/staff-sw.js', { scope: '/staff/' }).catch((error) => {
        console.error('[staff:pwa]', error)
      })
    }
  }, [])

  return (
    <div dir="rtl" className="min-h-dvh bg-[#f6f3ee] pb-24 text-[#29251f]">
      <header className="sticky top-0 z-30 border-b border-[#e7dfd2] bg-[#fffdfa]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/staff" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#35291d] text-lg font-bold text-[#e4c38e]">ع</span>
            <span><strong className="block text-sm text-[#35291d]">العنود</strong><span className="text-[11px] text-[#897b68]">تطبيق العمل الداخلي</span></span>
          </Link>
          <div className="text-left">
            <p className="text-xs font-semibold">{user.username}</p>
            <p className="text-[10px] text-[#897b68]">{user.role === 'admin' ? 'مدير' : 'موظف'}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-5">{children}</main>
      <nav aria-label="تنقل التطبيق" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e7dfd2] bg-[#fffdfa]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto grid max-w-3xl grid-cols-3">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === '/staff' ? pathname === href : pathname.startsWith(href)
            return <li key={href}><Link href={href} aria-current={active ? 'page' : undefined} className={cn('flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium', active ? 'text-[#946b36]' : 'text-[#8a8175]')}><Icon className="size-5" />{label}</Link></li>
          })}
        </ul>
      </nav>
    </div>
  )
}
