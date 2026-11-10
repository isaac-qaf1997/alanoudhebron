'use client'

import { ArrowLeftRight, MapPin, Phone, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { deleteOrder, updateOrderStatus } from '@/app/actions'
import { RegionBadge, StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/field'
import { STATUSES, STATUS_KEYS } from '@/lib/constants'
import { formatDateTime, formatMoney } from '@/lib/format'
import type { OrderDisplay } from '@/lib/order-display'
import { cn } from '@/lib/utils'

export function OrderCard({ order, isAdmin }: { order: OrderDisplay; isAdmin: boolean }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function changeStatus(status: string) {
    setError(null)
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, status)
      if (!result.ok) setError(result.error)
    })
  }

  function remove() {
    if (!window.confirm(`حذف الطلب #${order.id}؟ سيتم إرجاع القطع إلى المخزون.`)) return
    startTransition(async () => {
      const result = await deleteOrder(order.id)
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <article
      className={cn('flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-4', pending && 'opacity-60')}
      aria-busy={pending}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold">
            <span className="text-muted-foreground">#{order.id}</span> {order.customerName}
          </h3>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1" dir="ltr">
              <Phone className="size-3" aria-hidden="true" />
              {order.phone}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3" aria-hidden="true" />
              {order.city}
              {order.area ? ` — ${order.area}` : ''}
              {order.address ? ` — ${order.address}` : ''}
            </span>
            <span>{formatDateTime(order.createdAt)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RegionBadge region={order.region} />
          <StatusBadge status={order.status} />
        </div>
      </header>

      <ul className="flex flex-col gap-1 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-2">
            <span>
              {item.modelName}
              {item.color ? <span className="text-muted-foreground"> · {item.color}</span> : null}
              {item.size ? <span className="text-muted-foreground"> · مقاس {item.size}</span> : null}
              <span className="text-muted-foreground"> × {item.quantity}</span>
            </span>
            <span className="tabular-nums text-muted-foreground">{formatMoney(item.unitPrice * item.quantity)}</span>
          </li>
        ))}
        {order.exchanges.map((ex) => (
          <li key={ex.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-info/5 px-2 py-1.5 text-info">
            <span className="flex items-center gap-1.5">
              <ArrowLeftRight className="size-3.5" aria-hidden="true" />
              {ex.returnedName} {ex.returnedColor ? `(${ex.returnedColor})` : ''}{ex.returnedSize ? ` / ${ex.returnedSize}` : ''} × {ex.returnedQty}
              {' ← '}
              {ex.newName} ({ex.newColor}){ex.newSize ? ` / ${ex.newSize}` : ''} × {ex.newQty}
            </span>
            <span className="tabular-nums">
              {ex.diff >= 0 ? '+' : ''}
              {formatMoney(ex.diff)}
            </span>
          </li>
        ))}
      </ul>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex flex-col text-xs text-muted-foreground">
          <span>
            {order.courierName ?? 'بدون شركة توصيل'}
            {order.trackingNumber ? ` · ${order.trackingNumber}` : ''}
          </span>
          <span>
            توصيل {formatMoney(order.shippingFee)}
            {order.discount > 0 ? ` · خصم ${formatMoney(order.discount)}` : ''}
            {order.couponCode ? ` · كود ${order.couponCode}` : ''}
            {order.notes ? ` · ${order.notes}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold tabular-nums text-primary">{formatMoney(order.total)}</span>
          <Select
            aria-label={`تغيير حالة الطلب ${order.id}`}
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
          {isAdmin ? (
            <Button variant="ghost" size="icon" onClick={remove} disabled={pending} aria-label={`حذف الطلب ${order.id}`}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          ) : null}
        </div>
      </footer>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </article>
  )
}
