import { OrderForm } from '@/components/orders/order-form'
import { OrdersList } from '@/components/orders/orders-list'
import { requireUser } from '@/lib/auth/session'
import { getCouriers, getModels, getOrders } from '@/lib/queries'
import { toOrderDisplay } from '@/lib/order-display'

export default async function StaffOrdersPage() {
  const user = await requireUser()
  const [models, couriers, orders] = await Promise.all([getModels(), getCouriers(), getOrders()])
  const orderModels = models.map(({ cost: _cost, ...model }) => model)
  const orderCouriers = couriers.map(({ id, name }) => ({ id, name }))

  return <div className="space-y-5">
    <div><h1 className="text-xl font-bold">الطلبات</h1><p className="mt-1 text-xs text-[#8a8175]">إضافة الطلبات ومتابعة حالتها</p></div>
    <OrderForm models={orderModels} couriers={orderCouriers} />
    <OrdersList orders={orders.map(toOrderDisplay)} isAdmin={user.role === 'admin'} />
  </div>
}
