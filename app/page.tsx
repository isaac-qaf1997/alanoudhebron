import { Banknote, PackageCheck, TrendingUp, Truck } from 'lucide-react'
import Link from 'next/link'
import { CitiesPanel } from '@/components/dashboard/cities-panel'
import { CourierStatsPanel } from '@/components/dashboard/courier-stats-panel'
import { DateRangeFilter } from '@/components/dashboard/date-range-filter'
import { StatCard } from '@/components/dashboard/stat-card'
import { StatusPanel } from '@/components/dashboard/status-panel'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { buttonVariants } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { formatMoney, isDateString, localDateString, monthStart } from '@/lib/format'
import { getCouriers, getModels, getOrdersInRange } from '@/lib/queries'
import { computeStats } from '@/lib/stats'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const params = await searchParams
  const today = localDateString()
  const from = isDateString(params.from) ? params.from : monthStart(today)
  const to = isDateString(params.to) ? params.to : today

  const [orders, couriers, models] = await Promise.all([
    getOrdersInRange(from, to),
    getCouriers(),
    getModels(),
  ])
  const stats = computeStats(orders, couriers)
  const totalPieces = models.reduce((s, m) => s + m.colors.reduce((cs, c) => cs + c.stock, 0), 0)
  const lowStock = models.flatMap((m) =>
    m.colors.filter((c) => c.stock <= 2).map((c) => ({ id: c.id, label: `${m.name} — ${c.color}`, stock: c.stock })),
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-balance">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground">
            {'إحصائيات الطلبات من '}
            <span className="font-medium text-foreground">{from}</span>
            {' إلى '}
            <span className="font-medium text-foreground">{to}</span>
          </p>
        </div>
        <DateRangeFilter from={from} to={to} today={today} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="الطرود التي خرجت"
          value={stats.parcelsOut.toLocaleString('en-US')}
          hint={`من أصل ${stats.totalOrders} طلب`}
          icon={Truck}
          tone="warning"
        />
        <StatCard
          label="إجمالي المبيعات"
          value={formatMoney(stats.sales)}
          hint="بدون الطلبات الراجعة والملغية"
          icon={TrendingUp}
          tone="info"
        />
        <StatCard
          label="صافي الأرباح"
          value={formatMoney(stats.netProfit)}
          hint="للطلبات المسلّمة بعد التكلفة والتوصيل"
          icon={Banknote}
          tone={stats.netProfit >= 0 ? 'success' : 'destructive'}
        />
        <StatCard
          label="المبالغ المحصّلة الصافية"
          value={formatMoney(stats.collectedNet)}
          hint={`${formatMoney(stats.collected)} محصّل − ${formatMoney(stats.collectedFees)} رسوم`}
          icon={PackageCheck}
          tone="success"
        />
      </div>

      <CourierStatsPanel couriers={stats.couriers} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <CitiesPanel cities={stats.cities} className="lg:col-span-2" />
        <div className="flex flex-col gap-6">
          <StatusPanel counts={stats.statusCounts} total={stats.totalOrders} />
          <Panel title="ملخص المخزون">
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">عدد الموديلات</dt>
                <dd className="font-semibold">{models.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">إجمالي القطع المتوفرة</dt>
                <dd className="font-semibold">{totalPieces}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">ألوان قاربت على النفاد</dt>
                <dd className={lowStock.length ? 'font-semibold text-destructive' : 'font-semibold'}>
                  {lowStock.length}
                </dd>
              </div>
            </dl>
            {lowStock.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-1.5 border-t border-border pt-3 text-xs">
                {lowStock.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span className="truncate text-muted-foreground">{item.label}</span>
                    <span className="text-destructive">{item.stock}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <Link href="/inventory" className={buttonVariants({ variant: 'outline', className: 'mt-4 w-full' })}>
              إدارة المخزون
            </Link>
          </Panel>
        </div>
      </div>

      <RecentOrders orders={orders.slice(0, 6)} />
    </div>
  )
}
