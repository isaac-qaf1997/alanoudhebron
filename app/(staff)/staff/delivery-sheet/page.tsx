import { Download } from 'lucide-react'
import { SheetFilters } from '@/components/delivery-sheet/sheet-filters'
import { RegionBadge, StatusBadge } from '@/components/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState, Panel } from '@/components/ui/panel'
import { formatMoney, isDateString, localDateString } from '@/lib/format'
import { getCouriers, getDeliverySheet } from '@/lib/queries'
import { requireUser } from '@/lib/auth/session'

export default async function StaffDeliverySheetPage({ searchParams }: { searchParams: Promise<{ date?: string; courier?: string }> }) {
  const user = await requireUser()
  const params = await searchParams
  const today = localDateString()
  const date = isDateString(params.date) ? params.date : today
  const courierId = Number(params.courier) || null
  const [couriers, rows] = await Promise.all([getCouriers(), getDeliverySheet(date, courierId)])
  const filterCouriers = couriers.map(({ id, name }) => ({ id, name }))
  const totals = rows.reduce((acc, o) => ({
    amount: acc.amount + o.total,
    fees: acc.fees + o.courierFee,
    pieces: acc.pieces + o.items.reduce((sum, item) => sum + item.quantity, 0),
  }), { amount: 0, fees: 0, pieces: 0 })
  const exportHref = `/api/delivery-sheet?date=${date}${courierId ? `&courier=${courierId}` : ''}`

  return <div className="space-y-5">
    <div><h1 className="text-xl font-bold">كشف التوصيل اليومي</h1><p className="mt-1 text-xs text-[#8a8175]">الطرود التي سُلّمت لشركة التوصيل</p></div>
    <div className="flex flex-wrap items-end gap-2"><SheetFilters date={date} courierId={courierId} couriers={filterCouriers} today={today} />
      <a href={exportHref} className={buttonVariants({ className: rows.length ? '' : 'pointer-events-none opacity-50' })} aria-disabled={rows.length === 0}><Download className="size-4" />تصدير Excel</a>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-[#e8dfd2] bg-white p-4"><p className="text-xs text-[#8a8175]">عدد الطرود</p><p className="mt-1 text-xl font-bold">{rows.length}</p></div>
      <div className="rounded-2xl border border-[#e8dfd2] bg-white p-4"><p className="text-xs text-[#8a8175]">عدد القطع</p><p className="mt-1 text-xl font-bold">{totals.pieces}</p></div>
      <div className="rounded-2xl border border-[#e8dfd2] bg-white p-4"><p className="text-xs text-[#8a8175]">المبلغ المطلوب</p><p className="mt-1 text-xl font-bold">{formatMoney(totals.amount)}</p></div>
      {user.role === 'admin' ? <div className="rounded-2xl border border-[#e8dfd2] bg-white p-4"><p className="text-xs text-[#8a8175]">الصافي بعد الرسوم</p><p className="mt-1 text-xl font-bold">{formatMoney(totals.amount - totals.fees)}</p></div> : null}
    </div>
    <Panel title={`كشف ${date}`}>
      {rows.length === 0 ? <EmptyState>لا توجد طرود سُلّمت لشركة التوصيل في هذا اليوم.</EmptyState> :
        <div className="space-y-3">{rows.map((o) => <article key={o.id} className="rounded-xl border border-[#e8dfd2] bg-white p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="font-bold">{o.customerName}</p><p className="mt-1 text-xs text-[#8a8175]" dir="ltr">{o.phone}</p></div><StatusBadge status={o.status} /></div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><p>المدينة: {o.city}</p><p>المنطقة: <RegionBadge region={o.region} /></p><p>شركة التوصيل: {o.courierName ?? '—'}</p><p>التتبع: {o.trackingNumber || '—'}</p></div>
          <p className="mt-3 border-t border-[#eee8df] pt-3 text-sm font-bold">{formatMoney(o.total)}</p>
        </article>)}</div>}
    </Panel>
  </div>
}
