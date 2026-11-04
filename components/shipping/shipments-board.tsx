'use client'

import { Send } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { bulkShip } from '@/app/actions'
import { ShipmentRow } from '@/components/shipping/shipment-row'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/field'
import { EmptyState, Panel } from '@/components/ui/panel'
import { STATUSES, type StatusKey } from '@/lib/constants'
import type { CourierPublic } from '@/lib/db/schema'
import type { OrderFull } from '@/lib/queries'
import { cn } from '@/lib/utils'

const TABS: { key: StatusKey | 'all'; label: string }[] = [
  { key: 'preparing', label: STATUSES.preparing.label },
  { key: 'shipped', label: STATUSES.shipped.label },
  { key: 'delivered', label: STATUSES.delivered.label },
  { key: 'returned', label: STATUSES.returned.label },
  { key: 'all', label: 'الكل' },
]

export function ShipmentsBoard({ orders, couriers }: { orders: OrderFull[]; couriers: CourierPublic[] }) {
  const [tab, setTab] = useState<StatusKey | 'all'>('preparing')
  const [courierFilter, setCourierFilter] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length }
    for (const o of orders) map[o.status] = (map[o.status] ?? 0) + 1
    return map
  }, [orders])

  const visible = orders.filter((o) => {
    if (tab !== 'all' && o.status !== tab) return false
    if (courierFilter === 'none') return !o.courierId
    if (courierFilter) return String(o.courierId) === courierFilter
    return true
  })

  const selectable = visible.filter((o) => o.status === 'preparing')
  const selectedVisible = selected.filter((id) => selectable.some((o) => o.id === id))

  function toggle(id: number) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  function shipSelected() {
    const missing = selectable.filter((o) => selectedVisible.includes(o.id) && !o.courierId)
    if (missing.length) {
      setError(`عيّني شركة توصيل للطلبات: ${missing.map((o) => `#${o.id}`).join('، ')}`)
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await bulkShip(selectedVisible)
      if (result.ok) {
        setSelected([])
        setError(result.warning ?? null)
      } else setError(result.error)
    })
  }

  return (
    <Panel title="الشحنات" description="تحديث شركة التوصيل والمنطقة يعيد حساب رسوم التوصيل تلقائياً">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="حالة الشحنة" className="flex flex-wrap gap-1 rounded-xl bg-muted p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm transition-colors',
                tab === t.key ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              <span className="ms-1.5 text-xs tabular-nums opacity-70">{counts[t.key] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="تصفية حسب شركة التوصيل"
            value={courierFilter}
            onChange={(e) => setCourierFilter(e.target.value)}
            className="h-9 w-44"
          >
            <option value="">كل الشركات</option>
            <option value="none">بدون شركة</option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          {selectable.length > 0 ? (
            <Button size="sm" onClick={shipSelected} disabled={pending || selectedVisible.length === 0}>
              <Send className="size-4" />
              تسليم المحدد للشركة ({selectedVisible.length})
            </Button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p role="alert" className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {visible.length === 0 ? (
        <EmptyState>لا توجد شحنات في هذا القسم.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th scope="col" className="w-10 py-2">
                  {selectable.length > 0 ? (
                    <input
                      type="checkbox"
                      aria-label="تحديد الكل"
                      className="size-4 accent-primary"
                      checked={selectedVisible.length === selectable.length}
                      onChange={(e) => setSelected(e.target.checked ? selectable.map((o) => o.id) : [])}
                    />
                  ) : (
                    <span className="sr-only">تحديد</span>
                  )}
                </th>
                <th scope="col" className="py-2 text-start font-medium">الطلب</th>
                <th scope="col" className="py-2 text-start font-medium">المدينة</th>
                <th scope="col" className="py-2 text-start font-medium">المنطقة</th>
                <th scope="col" className="py-2 text-start font-medium">شركة التوصيل</th>
                <th scope="col" className="py-2 text-start font-medium">رقم التتبع</th>
                <th scope="col" className="py-2 text-start font-medium">المبلغ</th>
                <th scope="col" className="py-2 text-start font-medium">الحالة</th>
                <th scope="col" className="py-2">
                  <span className="sr-only">إجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => (
                <ShipmentRow
                  key={`${order.id}-${order.courierId}-${order.region}-${order.trackingNumber}`}
                  order={order}
                  couriers={couriers}
                  selectable={order.status === 'preparing'}
                  selected={selected.includes(order.id)}
                  onToggle={() => toggle(order.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
