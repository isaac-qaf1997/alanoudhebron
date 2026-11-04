import type { Metadata } from 'next'
import { OrderForm } from '@/components/orders/order-form'
import { OrdersList } from '@/components/orders/orders-list'
import { requireUser } from '@/lib/auth/session'
import { getCouriers, getModels, getOrders } from '@/lib/queries'
import { toOrderDisplay } from '@/lib/order-display'

export const metadata: Metadata = { title: 'الطلبات | العنود للزي الشرعي' }

export default async function OrdersPage() {
  const user = await requireUser()
  const [models, couriers, orders] = await Promise.all([getModels(), getCouriers(), getOrders()])
  const orderModels = models.map(({ cost: _cost, ...model }) => model)
  const orderCouriers = couriers.map(({ id, name }) => ({ id, name }))

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[440px_minmax(0,1fr)]">
      <OrderForm models={orderModels} couriers={orderCouriers} />
      <OrdersList orders={orders.map(toOrderDisplay)} isAdmin={user.role === 'admin'} />
    </div>
  )
}
