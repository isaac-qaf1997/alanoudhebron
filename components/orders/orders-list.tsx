'use client'

import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { OrderCard } from '@/components/orders/order-card'
import { Input, Select } from '@/components/ui/field'
import { EmptyState, Panel } from '@/components/ui/panel'
import { REGIONS, REGION_KEYS, STATUSES, STATUS_KEYS } from '@/lib/constants'
import type { CourierPublic } from '@/lib/db/schema'
import type { OrderFull } from '@/lib/queries'

export function OrdersList({ orders, isAdmin }: { orders: OrderFull[]; isAdmin: boolean }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [region, setRegion] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      if (status && o.status !== status) return false
      if (region && o.region !== region) return false
      if (!q) return true
      return [o.customerName, o.phone, String(o.id), o.trackingNumber ?? '', o.city]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [orders, query, status, region])

  return (
    <Panel title="الطلبات" description={`${orders.length} طلب مسجّل`}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="بحث"
            placeholder="بحث بالاسم، الهاتف، رقم الطلب أو التتبع"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select aria-label="تصفية بالحالة" value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40">
          <option value="">كل الحالات</option>
          {STATUS_KEYS.map((s) => (
            <option key={s} value={s}>
              {STATUSES[s].label}
            </option>
          ))}
        </Select>
        <Select aria-label="تصفية بالمنطقة" value={region} onChange={(e) => setRegion(e.target.value)} className="sm:w-40">
          <option value="">كل المناطق</option>
          {REGION_KEYS.map((r) => (
            <option key={r} value={r}>
              {REGIONS[r].label}
            </option>
          ))}
        </Select>
      </div>
      {filtered.length === 0 ? (
        <EmptyState>لا توجد طلبات مطابقة.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} isAdmin={isAdmin} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
