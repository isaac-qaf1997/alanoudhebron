import { createHash } from 'node:crypto'
import { and, eq, isNotNull, or, sql, type SQL } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  couriers,
  modelColors,
  orderExchanges,
  orderItems,
  orders,
  shippingWebhookEvents,
  type Order,
} from '@/lib/db/schema'
import { decryptShippingSecret, safeSecretEqual } from '@/lib/shipping/credentials'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : null
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return null
}

function normalizeStatus(value: string) {
  const status = value.trim().toLowerCase().replace(/[\s-]+/g, '_')
  const map: Record<string, Order['status']> = {
    preparing: 'preparing',
    created: 'preparing',
    pending: 'preparing',
    confirmed: 'preparing',
    ready_for_pickup: 'preparing',
    قيد_التجهيز: 'preparing',
    shipped: 'shipped',
    in_transit: 'shipped',
    out_for_delivery: 'shipped',
    picked_up: 'shipped',
    on_the_way: 'shipped',
    delivering: 'shipped',
    قيد_التوصيل: 'shipped',
    في_الطريق: 'shipped',
    خرج_للتوصيل: 'shipped',
    delivered: 'delivered',
    completed: 'delivered',
    تم_التسليم: 'delivered',
    مستلم: 'delivered',
    returned: 'returned',
    return: 'returned',
    rto: 'returned',
    failed_return: 'returned',
    راجع: 'returned',
    مرتجع: 'returned',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    cancel: 'cancelled',
    ملغي: 'cancelled',
    ملغى: 'cancelled',
  }
  return map[status] ?? null
}

async function restoreOrDeductOrderStock(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], orderId: number, direction: 1 | -1) {
  const [items, exchanges] = await Promise.all([
    tx.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    tx.select().from(orderExchanges).where(eq(orderExchanges.orderId, orderId)),
  ])
  const changes = [
    ...items.map((item) => ({ modelId: item.modelId, color: item.color, delta: direction * item.quantity })),
    ...exchanges.flatMap((exchange) => [
      { modelId: exchange.newModelId, color: exchange.newColor, delta: direction * exchange.newQty },
      { modelId: exchange.returnedModelId, color: exchange.returnedColor, delta: -direction * exchange.returnedQty },
    ]),
  ]
  for (const change of changes) {
    if (!change.modelId || !change.color) continue
    await tx
      .update(modelColors)
      .set({ stock: sql`greatest(${modelColors.stock} + ${change.delta}, 0)` })
      .where(sql`${modelColors.modelId} = ${change.modelId} and ${modelColors.color} = ${change.color}`)
  }
}

async function findCourier(token: string) {
  const integrations = await db
    .select()
    .from(couriers)
    .where(and(eq(couriers.apiEnabled, true), isNotNull(couriers.secretTokenEncrypted)))
  for (const courier of integrations) {
    const expected = decryptShippingSecret(courier.secretTokenEncrypted)
    if (expected && safeSecretEqual(token, expected)) return courier
  }
  return null
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('x-shipping-token') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let courier: Awaited<ReturnType<typeof findCourier>>
  try {
    courier = await findCourier(token)
  } catch (error) {
    console.error('[shipping-webhook] credential verification failed', error)
    return NextResponse.json({ error: 'Webhook authentication is not configured' }, { status: 503 })
  }
  if (!courier) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rawBody = await request.text()
  if (Buffer.byteLength(rawBody, 'utf8') > 64 * 1024) {
    return NextResponse.json({ error: 'Webhook payload is too large' }, { status: 413 })
  }
  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const root = asRecord(payload)
  const data = asRecord(root?.data) ?? asRecord(root?.shipment) ?? root
  if (!data) return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })

  const trackingNumber = firstString(
    data.tracking_number,
    data.trackingNumber,
    data.tracking_code,
    data.waybill_number,
    data.awb,
  )
  const externalShipmentId = firstString(data.shipment_id, data.shipmentId, data.id)
  const providerStatus = firstString(data.status, data.shipment_status, data.delivery_status, data.event)
  if ((!trackingNumber && !externalShipmentId) || !providerStatus) {
    return NextResponse.json(
      { error: 'Expected tracking_number or shipment_id, and status' },
      { status: 400 },
    )
  }

  const mappedStatus = normalizeStatus(providerStatus)
  if (!mappedStatus) return NextResponse.json({ error: `Unsupported status: ${providerStatus}` }, { status: 422 })

  const orderConditions = [eq(orders.courierId, courier.id)]
  const identifiers: SQL[] = []
  if (trackingNumber) identifiers.push(eq(orders.trackingNumber, trackingNumber))
  if (externalShipmentId) identifiers.push(eq(orders.externalShipmentId, externalShipmentId))
  orderConditions.push(or(...identifiers)!)
  const [matchedOrder] = await db.select().from(orders).where(and(...orderConditions)).limit(1)
  if (!matchedOrder) return NextResponse.json({ error: 'No matching order found' }, { status: 404 })

  const suppliedEventId = firstString(root?.event_id, root?.eventId, data.event_id, data.eventId)
  const eventId = `${courier.id}:${suppliedEventId ?? createHash('sha256').update(`${courier.id}:${rawBody}`).digest('hex')}`

  try {
    const result = await db.transaction(async (tx) => {
      const [event] = await tx
        .insert(shippingWebhookEvents)
        .values({
          eventId,
          courierId: courier.id,
          trackingNumber: trackingNumber ?? matchedOrder.trackingNumber ?? externalShipmentId!,
          providerStatus,
          payload: { event_id: eventId, status: providerStatus },
        })
        .onConflictDoNothing({ target: shippingWebhookEvents.eventId })
        .returning({ id: shippingWebhookEvents.id })
      if (!event) return { duplicate: true }

      const [current] = await tx.select().from(orders).where(eq(orders.id, matchedOrder.id)).limit(1)
      if (!current) return { duplicate: false, missing: true }
      const wasInactive = current.status === 'returned' || current.status === 'cancelled'
      const isInactive = mappedStatus === 'returned' || mappedStatus === 'cancelled'
      if (!wasInactive && isInactive) await restoreOrDeductOrderStock(tx, current.id, 1)
      if (wasInactive && !isInactive) await restoreOrDeductOrderStock(tx, current.id, -1)

      const now = new Date()
      const leftWarehouse = mappedStatus === 'shipped' || mappedStatus === 'delivered' || mappedStatus === 'returned'
      await tx
        .update(orders)
        .set({
          status: mappedStatus,
          trackingNumber: trackingNumber ?? current.trackingNumber,
          externalShipmentId: externalShipmentId ?? current.externalShipmentId,
          shippingProviderStatus: providerStatus,
          shippingSyncedAt: now,
          shippingError: null,
          shippedAt: leftWarehouse ? (current.shippedAt ?? now) : mappedStatus === 'preparing' ? null : current.shippedAt,
          deliveredAt: mappedStatus === 'delivered' ? (current.deliveredAt ?? now) : null,
        })
        .where(eq(orders.id, current.id))
      return { duplicate: false, orderId: current.id, status: mappedStatus }
    })

    if ('duplicate' in result && result.duplicate) {
      return NextResponse.json({ ok: true, duplicate: true })
    }
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[shipping-webhook] processing failed', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
