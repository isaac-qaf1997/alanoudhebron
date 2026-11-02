'use client'

import { Save } from 'lucide-react'
import { useState, useTransition } from 'react'
import { updateOrderStatus, updateShipping } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/field'
import { REGIONS, REGION_KEYS, STATUSES, STATUS_KEYS } from '@/lib/constants'
import type { Courier } from '@/lib/db/schema'
import { formatMoney } from '@/lib/format'
import type { OrderFull } from '@/lib/queries'
import { cn } from '@/lib/utils'

export function ShipmentRow({
  order,
  couriers,
  selectable,
  selected,
  onToggle,
}: {
  order: OrderFull
  couriers: Courier[]
  selectable: boolean
  selected: boolean
  onToggle: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState({
    courierId: order.courierId ? String(order.courierId) : '',
    region: order.region,
    trackingNumber: order.trackingNumber ?? '',
  })

  const dirty =
    draft.courierId !== (order.courierId ? String(order.courierId) : '') ||
    draft.region !== order.region ||
    draft.trackingNumber !== (order.trackingNumber ?? '')

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await updateShipping(order.id, {
        courierId: draft.courierId ? Number(draft.courierId) : null,
        region: draft.region,
        trackingNumber: draft.trackingNumber,
      })
      if (!result.ok) setError(result.error)
    })
  }

  function changeStatus(status: string) {
    setError(null)
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, status)
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <>
      <tr className={cn('border-b border-border/60 align-middle', pending && 'opacity-60')}>
        <td className="py-2">
          {selectable ? (
            <input
              type="checkbox"
              aria-label={`تحديد الطلب ${order.id}`}
              className="size-4 accent-primary"
              checked={selected}
              onChange={onToggle}
            />
          ) : null}
        </td>
        <td className="py-2">
          <p className="font-medium">
            <span className="text-muted-foreground">#{order.id}</span> {order.customerName}
          </p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {order.phone}
          </p>
        </td>
        <td className="py-2">{order.city}</td>
        <td className="py-2 pe-2">
          <Select
            aria-label="المنطقة"
            value={draft.region}
            onChange={(e) => setDraft((d) => ({ ...d, region: e.target.value }))}
            className="h-9 w-32"
          >
            {REGION_KEYS.map((r) => (
              <option key={r} value={r}>
                {REGIONS[r].label}
              </option>
            ))}
          </Select>
        </td>
        <td className="py-2 pe-2">
          <Select
            aria-label="شركة التوصيل"
            value={draft.courierId}
            onChange={(e) => setDraft((d) => ({ ...d, courierId: e.target.value }))}
            className="h-9 w-36"
          >
            <option value="">غير محددة</option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </td>
        <td className="py-2 pe-2">
          <Input
            aria-label="رقم التتبع"
            dir="ltr"
            value={draft.trackingNumber}
            onChange={(e) => setDraft((d) => ({ ...d, trackingNumber: e.target.value }))}
            className="h-9 w-32 text-end"
          />
        </td>
        <td className="py-2">
          <p className="font-semibold tabular-nums">{formatMoney(order.total)}</p>
          <p className="text-xs text-muted-foreground tabular-nums">رسوم {formatMoney(order.courierFee)}</p>
        </td>
        <td className="py-2 pe-2">
          <Select
            aria-label="الحالة"
            value={order.status}
            onChange={(e) => changeStatus(e.target.value)}
            disabled={pending}
            className="h-9 w-32"
          >
            {STATUS_KEYS.map((s) => (
              <option key={s} value={s}>
                {STATUSES[s].label}
              </option>
            ))}
          </Select>
        </td>
        <td className="py-2">
          <Button
            size="icon-sm"
            variant={dirty ? 'default' : 'ghost'}
            onClick={save}
            disabled={!dirty || pending}
            aria-label={`حفظ بيانات شحن الطلب ${order.id}`}
          >
            <Save className="size-4" />
          </Button>
        </td>
      </tr>
      {error ? (
        <tr>
          <td colSpan={9} role="alert" className="pb-2 text-sm text-destructive">
            {error}
          </td>
        </tr>
      ) : null}
    </>
  )
}
