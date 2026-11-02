import type { Metadata } from 'next'
import { OrderForm } from '@/components/orders/order-form'
import { OrdersList } from '@/components/orders/orders-list'
import { getCouriers, getModels, getOrders } from '@/lib/queries'

export const metadata: Metadata = { title: 'الطلبات | العنود للزي الشرعي' }

export default async function OrdersPage() {
  const [models, couriers, orders] = await Promise.all([getModels(), getCouriers(), getOrders()])

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[440px_minmax(0,1fr)]">
      <OrderForm models={models} couriers={couriers.filter((c) => c.active)} />
      <OrdersList orders={orders} couriers={couriers} />
    </div>
  )
}
