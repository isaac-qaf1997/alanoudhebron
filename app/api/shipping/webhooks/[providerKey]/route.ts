import { createHash, timingSafeEqual } from 'node:crypto'
import { and, eq, or, sql, type SQL } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { couriers, modelColors, orderExchanges, orderItems, orders, shippingWebhookEvents } from '@/lib/db/schema'
import { INACTIVE_STATUSES } from '@/lib/constants'
import { normalizeCarrierStatus } from '@/lib/shipping/dispatch'

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

async function restoreOrDeductStock(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], orderId: number, direction: 1 | -1) {
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
    await tx.update(modelColors)
      .set({ stock: sql`greatest(${modelColors.stock} + ${change.delta}, 0)` })
      .where(and(eq(modelColors.modelId, change.modelId), eq(modelColors.color, change.color)))
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ providerKey: string }> }) {
  const { providerKey } = await context.params
  const key = providerKey.toLowerCase().replace(/[^a-z0-9_-]/g, '')
  if (!key || key !== providerKey) return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })

  const suffix = key.toUpperCase().replace(/[^A-Z0-9]/g, '_')
  const secret = process.env[`COURIER_${suffix}_WEBHOOK_SECRET`]
  const supplied = request.headers.get('x-webhook-secret') || ''
  if (!secret || !safeEqual(secret, supplied)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > 64_000) return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  const rawBody = await request.text()
  if (rawBody.length > 64_000) return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  const payload = (() => { try { return JSON.parse(rawBody) } catch { return null } })() as null | {
    eventId?: string
    event?: string
    status?: string
    trackingNumber?: string
    shipmentId?: string | number
    reference?: string
  }
  if (!payload || typeof payload.status !== 'string' || !payload.status.trim()) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const trackingNumber = typeof payload.trackingNumber === 'string' ? payload.trackingNumber.trim().slice(0, 120) : ''
  const reference = typeof payload.reference === 'string' ? payload.reference.trim().slice(0, 120) : ''
  const shipmentId = typeof payload.shipmentId === 'string' || typeof payload.shipmentId === 'number' ? String(payload.shipmentId).slice(0, 120) : ''

  const [courier] = await db.select().from(couriers).where(eq(couriers.integrationKey, key)).limit(1)
  if (!courier) return NextResponse.json({ error: 'Unknown carrier' }, { status: 404 })
  if (!courier.active) return NextResponse.json({ error: 'Carrier is inactive' }, { status: 403 })

  const status = normalizeCarrierStatus(payload.status)
  if (!status) return NextResponse.json({ error: 'Unsupported status' }, { status: 422 })

  const eventId = String(typeof payload.eventId === 'string' && payload.eventId.trim() ? payload.eventId : `sha256:${createHash('sha256').update(rawBody).digest('hex')}`).slice(0, 180)
  const tracking = trackingNumber ? eq(orders.trackingNumber, trackingNumber) : undefined
  const external = shipmentId ? eq(orders.externalShipmentId, shipmentId) : undefined
  const referenceMatch = reference.match(/^ORDER-(\d+)$/)
  const byReference = referenceMatch ? eq(orders.id, Number(referenceMatch[1])) : undefined
  const identity = [tracking, external, byReference].filter((value): value is SQL => Boolean(value))
  if (!identity.length) return NextResponse.json({ error: 'Shipment identifier required' }, { status: 400 })

  const [matchedOrder] = await db.select({ id: orders.id }).from(orders)
    .where(and(eq(orders.courierId, courier.id), or(...identity))).limit(1)
  if (!matchedOrder) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })

  const result = await db.transaction(async (tx) => {
    // Insert first with conflict handling so carrier retries cannot apply an event twice.
    const [inserted] = await tx.insert(shippingWebhookEvents).values({
      providerKey: key,
      eventId,
      orderId: matchedOrder.id,
      eventType: (typeof payload.event === 'string' ? payload.event : payload.status).slice(0, 120),
      payload: JSON.stringify(payload).slice(0, 10000),
    }).onConflictDoNothing().returning({ id: shippingWebhookEvents.id })
    if (!inserted) return { duplicate: true as const }

    const [order] = await tx.select().from(orders).where(eq(orders.id, matchedOrder.id)).for('update')
    if (!order) throw new Error('Order disappeared while processing webhook')

    const wasInactive = INACTIVE_STATUSES.includes(order.status as (typeof INACTIVE_STATUSES)[number])
    const isInactive = INACTIVE_STATUSES.includes(status as (typeof INACTIVE_STATUSES)[number])
    if (!wasInactive && isInactive) await restoreOrDeductStock(tx, order.id, 1)
    if (wasInactive && !isInactive) await restoreOrDeductStock(tx, order.id, -1)

    const now = new Date()
    await tx.update(orders).set({
      status,
      shippedAt: status === 'preparing' ? null : order.shippedAt ?? now,
      deliveredAt: status === 'delivered' ? order.deliveredAt ?? now : null,
      trackingNumber: trackingNumber || order.trackingNumber,
      externalShipmentId: shipmentId || order.externalShipmentId,
      syncStatus: 'synced',
      syncError: null,
      lastSyncedAt: now,
    }).where(eq(orders.id, order.id))
    return { duplicate: false as const, orderId: order.id }
  })

  if (result.duplicate) return NextResponse.json({ ok: true, duplicate: true })
  return NextResponse.json({ ok: true, orderId: result.orderId, status })
}
