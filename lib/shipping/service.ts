import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { couriers, orders } from '@/lib/db/schema'
import { createCarrierShipment } from '@/lib/shipping/provider'

export async function sendOrderToCourier(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) throw new Error('الطلب غير موجود')
  if (!order.courierId) throw new Error('يجب تحديد شركة التوصيل أولاً')
  if (order.trackingNumber || order.externalShipmentId) {
    return {
      trackingNumber: order.trackingNumber,
      shipmentId: order.externalShipmentId,
      providerStatus: order.shippingProviderStatus,
      alreadySubmitted: true,
    }
  }

  const [courier] = await db.select().from(couriers).where(eq(couriers.id, order.courierId)).limit(1)
  if (!courier) throw new Error('شركة التوصيل غير موجودة')
  if (!courier.apiEnabled) return null

  try {
    const result = await createCarrierShipment(courier, order)
    await db
      .update(orders)
      .set({
        trackingNumber: result.trackingNumber,
        externalShipmentId: result.shipmentId,
        shippingProviderStatus: result.providerStatus ?? 'created',
        shippingSyncedAt: new Date(),
        shippingError: null,
      })
      .where(eq(orders.id, orderId))
    return { ...result, alreadySubmitted: false }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'فشل إرسال الطلب لشركة التوصيل'
    await db.update(orders).set({ shippingError: message }).where(eq(orders.id, orderId))
    throw error
  }
}
