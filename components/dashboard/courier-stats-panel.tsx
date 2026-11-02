import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState, Panel } from '@/components/ui/panel'
import { formatMoney } from '@/lib/format'
import type { DashboardStats } from '@/lib/stats'

export function CourierStatsPanel({ couriers }: { couriers: DashboardStats['couriers'] }) {
  return (
    <Panel
      title="إحصائيات شركات التوصيل"
      description="الطرود المسلّمة والمبالغ المحصّلة الصافية لكل شركة"
    >
      {couriers.length === 0 ? (
        <EmptyState>
          <p>لم تتم إضافة شركات توصيل بعد.</p>
          <Link href="/shipping" className={buttonVariants({ size: 'sm' })}>
            إضافة شركة توصيل
          </Link>
        </EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th scope="col" className="py-2 text-start font-medium">الشركة</th>
                <th scope="col" className="py-2 text-start font-medium">قيد التوصيل</th>
                <th scope="col" className="py-2 text-start font-medium">تم التسليم</th>
                <th scope="col" className="py-2 text-start font-medium">راجع</th>
                <th scope="col" className="py-2 text-start font-medium">المحصّل</th>
                <th scope="col" className="py-2 text-start font-medium">رسوم الشركة</th>
                <th scope="col" className="py-2 text-start font-medium">الصافي المستحق</th>
              </tr>
            </thead>
            <tbody>
              {couriers.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="py-3 text-start font-semibold">{c.name}</th>
                  <td className="py-3 tabular-nums text-warning">{c.inTransit}</td>
                  <td className="py-3 tabular-nums text-success">{c.delivered}</td>
                  <td className="py-3 tabular-nums text-destructive">{c.returned}</td>
                  <td className="py-3 tabular-nums">{formatMoney(c.collected)}</td>
                  <td className="py-3 tabular-nums text-muted-foreground">{formatMoney(c.fees)}</td>
                  <td className="py-3 font-semibold tabular-nums text-primary">
                    {formatMoney(c.collected - c.fees)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
