import { Download } from 'lucide-react'
import type { Metadata } from 'next'
import { SheetFilters } from '@/components/delivery-sheet/sheet-filters'
import { RegionBadge, StatusBadge } from '@/components/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState, Panel } from '@/components/ui/panel'
import { formatMoney, isDateString, localDateString } from '@/lib/format'
import { getCouriers, getDeliverySheet } from '@/lib/queries'
import { requireUser } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'كشف التوصيل اليومي | العنود للزي الشرعي' }

export default async function DeliverySheetPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; courier?: string }>
}) {
  const user = await requireUser()
  const params = await searchParams
  const today = localDateString()
  const date = isDateString(params.date) ? params.date : today
  const courierId = Number(params.courier) || null

  const [couriers, rows] = await Promise.all([getCouriers(), getDeliverySheet(date, courierId)])
  const filterCouriers = couriers.map(({ id, name }) => ({ id, name }))
  const totals = rows.reduce(
    (acc, o) => ({ amount: acc.amount + o.total, fees: acc.fees + o.courierFee, pieces: acc.pieces + o.items.reduce((s, i) => s + i.quantity, 0) }),
    { amount: 0, fees: 0, pieces: 0 },
  )
  const exportHref = `/api/delivery-sheet?date=${date}${courierId ? `&courier=${courierId}` : ''}`

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">كشف التوصيل اليومي</h1>
          <p className="text-sm text-muted-foreground">
            الطرود التي سُلّمت لشركة التوصيل في اليوم المحدد، جاهزة للتصدير إلى Excel.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <SheetFilters date={date} courierId={courierId} couriers={filterCouriers} today={today} />
          <a
            href={exportHref}
            className={buttonVariants({ className: rows.length ? '' : 'pointer-events-none opacity-50' })}
            aria-disabled={rows.length === 0}
          >
            <Download className="size-4" />
            تصدير Excel
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {([
          ['عدد الطرود', rows.length.toString()],
          ['عدد القطع', totals.pieces.toString()],
          ['المبلغ المطلوب تحصيله', formatMoney(totals.amount)],
          ...(user.role === 'admin' ? [['الصافي بعد الرسوم', formatMoney(totals.amount - totals.fees)]] : []),
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <Panel title={`كشف ${date}`}>
        {rows.length === 0 ? (
          <EmptyState>
            لا توجد طرود سُلّمت لشركة التوصيل في هذا اليوم. حوّلي حالة الطلب إلى «قيد التوصيل» من صفحة الشحن.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  {['#', 'العميلة', 'الهاتف', 'المدينة', 'المنطقة', 'المنتجات', 'الشركة', 'التتبع', 'المبلغ', 'الحالة'].map((h) => (
                    <th key={h} scope="col" className="py-2 pe-3 text-start font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="border-b border-border/60 align-top last:border-0">
                    <td className="py-3 pe-3 text-muted-foreground">{o.id}</td>
                    <td className="py-3 pe-3 font-medium">{o.customerName}</td>
                    <td className="py-3 pe-3" dir="ltr">
                      {o.phone}
                    </td>
                    <td className="py-3 pe-3">
                      {o.city}
                      {o.address ? <span className="block text-xs text-muted-foreground">{o.address}</span> : null}
                    </td>
                    <td className="py-3 pe-3">
                      <RegionBadge region={o.region} />
                    </td>
                    <td className="py-3 pe-3 text-xs">
                      {o.items.map((i) => `${i.modelName} (${i.color}) × ${i.quantity}`).join('، ')}
                      {o.exchanges.length ? <span className="block text-info">يشمل استبدال</span> : null}
                    </td>
                    <td className="py-3 pe-3">{o.courierName ?? '—'}</td>
                    <td className="py-3 pe-3" dir="ltr">
                      {o.trackingNumber || '—'}
                    </td>
                    <td className="py-3 pe-3 font-semibold tabular-nums">{formatMoney(o.total)}</td>
                    <td className="py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
