import type { Metadata } from 'next'
import { CourierManager } from '@/components/shipping/courier-manager'
import { ShipmentsBoard } from '@/components/shipping/shipments-board'
import { getCouriers, getOrders } from '@/lib/queries'
import { requireRole } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'إدارة الشحن | العنود للزي الشرعي' }

export default async function ShippingPage() {
  await requireRole('admin')
  const [couriers, orders] = await Promise.all([getCouriers(), getOrders()])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">إدارة الشحن</h1>
        <p className="text-sm text-muted-foreground">
          اربطِي واجهة API لكل شركة، وأرسلي الطرود تلقائياً وتابعي تحديثات الحالة من Webhook.
        </p>
      </div>
      <ShipmentsBoard orders={orders} couriers={couriers} />
      <CourierManager couriers={couriers} />
    </div>
  )
}
