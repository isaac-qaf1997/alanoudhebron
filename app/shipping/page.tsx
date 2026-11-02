import type { Metadata } from 'next'
import { CourierManager } from '@/components/shipping/courier-manager'
import { ShipmentsBoard } from '@/components/shipping/shipments-board'
import { getCouriers, getOrders } from '@/lib/queries'

export const metadata: Metadata = { title: 'إدارة الشحن | العنود للزي الشرعي' }

export default async function ShippingPage() {
  const [couriers, orders] = await Promise.all([getCouriers(), getOrders()])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">إدارة الشحن</h1>
        <p className="text-sm text-muted-foreground">
          عيّني شركة التوصيل والمنطقة لكل طلبية وتابعي حالة الشحنات.
        </p>
      </div>
      <ShipmentsBoard orders={orders} couriers={couriers} />
      <CourierManager couriers={couriers} />
    </div>
  )
}
