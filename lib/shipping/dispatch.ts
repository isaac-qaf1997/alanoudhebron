import { and, eq, inArray, isNull, lt, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { couriers, orderItems, orders } from '@/lib/db/schema'

type CarrierConfig = { apiUrl: string; token: string; createPath: string }

function getCarrierConfig(key: string): CarrierConfig | null {
  const suffix = key.toUpperCase().replace(/[^A-Z0-9]/g, '_')
  const apiUrl = process.env[`COURIER_${suffix}_API_URL`]
  const token = process.env[`COURIER_${suffix}_API_TOKEN`]
  if (!apiUrl || !token) return null

  try {
    const base = new URL(apiUrl)
    if (base.protocol !== 'https:' || base.username || base.password) return null
    const createPath = process.env[`COURIER_${suffix}_CREATE_PATH`] || '/shipments'
    // A configured path must remain on the trusted carrier origin.
    if (!createPath.startsWith('/') || createPath.startsWith('//')) return null
    const endpoint = new URL(createPath, base)
    if (endpoint.origin !== base.origin || endpoint.protocol !== 'https:') return null
    return { apiUrl: base.origin, token, createPath }
  } catch {
    return null
  }
}

/** Atomically claims an order before contacting the carrier, preventing concurrent duplicate sends. */
export async function dispatchShipment(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
  if (!order?.courierId) return
  if (order.syncStatus === 'sent' || order.syncStatus === 'synced') return

  const [courier] = await db.select().from(couriers).where(eq(couriers.id, order.courierId))
  if (courier && !courier.active) {
    await db.update(orders).set({ syncStatus: 'not_configured', syncError: 'شركة التوصيل غير مفعّلة' }).where(eq(orders.id, orderId))
    return
  }
  if (!courier?.integrationKey) {
    await db.update(orders).set({ syncStatus: 'not_configured', syncError: null }).where(eq(orders.id, orderId))
    return
  }
  const config = getCarrierConfig(courier.integrationKey)
  if (!config) {
    await db.update(orders).set({ syncStatus: 'not_configured', syncError: 'إعدادات API غير صالحة أو غير مكتملة؛ يلزم عنوان HTTPS صالح' }).where(eq(orders.id, orderId))
    return
  }

  const now = new Date()
  const staleSendingBefore = new Date(now.getTime() - 5 * 60 * 1000)
  const [claim] = await db.update(orders)
    .set({ syncStatus: 'sending', syncError: null, lastSyncedAt: now })
    .where(and(
      eq(orders.id, orderId),
      or(
        inArray(orders.syncStatus, ['not_configured', 'failed']),
        and(eq(orders.syncStatus, 'sending'), or(isNull(orders.lastSyncedAt), lt(orders.lastSyncedAt, staleSendingBefore))),
      ),
    ))
    .returning({ id: orders.id })
  if (!claim) return

  try {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))
    const response = await fetch(new URL(config.createPath, config.apiUrl), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Idempotency-Key': `order-${order.id}`,
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        reference: `ORDER-${order.id}`,
        recipient: { name: order.customerName, phone: order.phone, city: order.city, region: order.region, address: order.address },
        codAmount: order.total,
        notes: order.notes,
        items: items.map((item) => ({ name: item.modelName, color: item.color, quantity: item.quantity })),
      }),
    })
    const result = await response.json().catch(() => ({})) as { id?: string | number; shipmentId?: string | number; trackingNumber?: string }
    if (!response.ok) throw new Error(`Carrier API HTTP ${response.status}`)
    const externalId = result.shipmentId ?? result.id
    if (externalId == null && !result.trackingNumber) throw new Error('Carrier response must include shipmentId/id or trackingNumber')

    await db.update(orders).set({
      externalShipmentId: externalId == null ? null : String(externalId),
      trackingNumber: result.trackingNumber || order.trackingNumber,
      syncStatus: 'sent',
      syncError: null,
      lastSyncedAt: new Date(),
    }).where(and(eq(orders.id, orderId), eq(orders.syncStatus, 'sending')))
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : 'Carrier API request failed'
    await db.update(orders).set({ syncStatus: 'failed', syncError: message }).where(and(eq(orders.id, orderId), eq(orders.syncStatus, 'sending')))
    console.error(`[shipping] dispatch failed for order ${orderId}`, error)
  }
}

export function normalizeCarrierStatus(value: unknown): 'preparing' | 'shipped' | 'delivered' | 'returned' | null {
  const status = String(value ?? '').trim().toLowerCase().replace(/[\\s-]+/g, '_')
  if (['pending', 'created', 'preparing', 'new'].includes(status)) return 'preparing'
  if (['shipped', 'in_transit', 'intransit', 'out_for_delivery', 'picked_up', 'arriving', 'on_the_way', 'قيد_التوصيل', 'قيد_الوصول', 'قيدوصول', 'في_الطريق'].includes(status)) return 'shipped'
  if (['delivered', 'completed', 'received', 'تم_التسليم', 'تم_التوصيل'].includes(status)) return 'delivered'
  if (['returned', 'return', 'rejected', 'return_to_sender', 'تم_الإرجاع', 'تم_الارجاع', 'مرتجع', 'راجع'].includes(status)) return 'returned'
  return null
}
