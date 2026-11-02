import Link from 'next/link'
import { RegionBadge, StatusBadge } from '@/components/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState, Panel } from '@/components/ui/panel'
import { formatDate, formatMoney } from '@/lib/format'
import type { OrderFull } from '@/lib/queries'

export function RecentOrders({ orders }: { orders: OrderFull[] }) {
  return (
    <Panel
      title="أحدث الطلبات"
      action={
        <Link href="/orders" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          عرض كل الطلبات
        </Link>
      }
    >
      {orders.length === 0 ? (
        <EmptyState>
          <p>لا توجد طلبات في هذه الفترة.</p>
          <div className="flex gap-2">
            <Link href="/orders" className={buttonVariants({ size: 'sm' })}>
              إنشاء طلب
            </Link>
            <Link href="/inventory" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
              إضافة موديل
            </Link>
          </div>
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-medium">
                  <span className="text-muted-foreground">#{o.id}</span> {o.customerName}
                </p>
                <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{o.city}</span>
                  <RegionBadge region={o.region} />
                  <span>{formatDate(o.createdAt)}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold tabular-nums">{formatMoney(o.total)}</span>
                <StatusBadge status={o.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
