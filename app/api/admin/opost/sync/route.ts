import { createHash } from 'node:crypto'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { authorizeRole } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { couriers, modelColors, orderExchanges, orderItems, orderShippingStatusHistory, orders } from '@/lib/db/schema'
import { INACTIVE_STATUSES, type StatusKey } from '@/lib/constants'

export const runtime = 'nodejs'
export const maxDuration = 60

const BASE = 'https://o.opost.ps'
const PAGE_SIZE = 150
const MAX_PAGES = 40
const CONCURRENCY = 8

type ApiRecord = Record<string, unknown>

function rootRecord(payload: unknown): ApiRecord | null {
  if (Array.isArray(payload)) {
    if (payload.length === 1 && payload[0] && typeof payload[0] === 'object') return rootRecord(payload[0])
    return null
  }
  return payload && typeof payload === 'object' ? payload as ApiRecord : null
}

function records(payload: unknown): ApiRecord[] {
  const root = rootRecord(payload)
  if (!root) return Array.isArray(payload) ? payload as ApiRecord[] : []
  for (const key of ['data', 'results', 'shipments']) {
    if (Array.isArray(root[key])) return root[key] as ApiRecord[]
    if (root[key] && typeof root[key] === 'object') {
      const nested = records(root[key])
      if (nested.length) return nested
    }
  }
  return []
}

function pagination(payload: unknown) {
  const root = rootRecord(payload)
  const page = root?.pagination
  if (!page || typeof page !== 'object') return null
  const value = page as ApiRecord
  const lastPage = Number(value.last_page ?? value.lastPage ?? 0)
  const perPage = Number(value.per_page ?? value.perPage ?? 0)
  const total = Number(value.total ?? 0)
  return Number.isInteger(lastPage) && lastPage > 0 && Number.isInteger(perPage) && perPage > 0
    ? { lastPage, perPage, total }
    : null
}

async function fetchPage(page: number, token: string): Promise<unknown> {
  const url = new URL('/api/resources/shipments', BASE)
  url.searchParams.set('col.notes', 'true')
  url.searchParams.set('col.is_cod', 'true')
  url.searchParams.set('col.consignee.address', 'true')
  url.searchParams.set('sort', 'area')
  url.searchParams.set('limit', String(PAGE_SIZE))
  url.searchParams.set('page', String(page))
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) throw new Error(`Opost ردّ برمز HTTP ${response.status} أثناء قراءة صفحة ${page}.`)
  return response.json()
}

async function fetchAllShipments(token: string) {
  const first = await fetchPage(1, token)
  const meta = pagination(first)
  if (!meta) throw new Error('Opost لم يُرجع معلومات الصفحات؛ أوقفنا المزامنة حتى لا نعتمد على قائمة ناقصة.')
  if (meta.lastPage > MAX_PAGES) {
    throw new Error(`قائمة Opost تحتاج ${meta.lastPage} صفحة (حجم الصفحة ${meta.perPage}). الحد الآمن ${MAX_PAGES}. لم نحدّث أي طلب.`)
  }
  const all = [...records(first)]
  for (let start = 2; start <= meta.lastPage; start += CONCURRENCY) {
    const pages = Array.from({ length: Math.min(CONCURRENCY, meta.lastPage - start + 1) }, (_, index) => start + index)
    const batch = await Promise.all(pages.map(page => fetchPage(page, token)))
    for (const payload of batch) all.push(...records(payload))
  }
  return { shipments: all, pagesRead: meta.lastPage, total: meta.total, perPage: meta.perPage }
}

function nestedRecord(value: unknown): ApiRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as ApiRecord : null
}

function textValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
}

function shipmentDetails(row: ApiRecord) {
  const statusObject = nestedRecord(row.status)
  const lastStatus = nestedRecord(row.last_status ?? row.lastStatus)
  const status = textValue(statusObject?.value ?? lastStatus?.status ?? row.status_code ?? row.status)
  const label = textValue(statusObject?.label ?? lastStatus?.label ?? row.status_label ?? row.status_name) || status
  const tracking = textValue(row.tracking_number ?? row.trackingNumber ?? row.tracking_code)
  const shipmentId = textValue(row.id ?? row.shipment_id ?? row.shipmentId)
  const occurred = textValue(lastStatus?.updated_at ?? lastStatus?.created_at ?? row.updated_at ?? row.created_at)
  const eventId = textValue(lastStatus?.id ?? row.last_status_id ?? row.event_id)
  return { status: status.toLowerCase(), label, tracking, shipmentId, occurred, eventId }
}

function orderStatusFor(providerStatus: string): StatusKey | null {
  if (['picked_up', 'out_for_delivery', 'in_transit', 'shipped'].includes(providerStatus)) return 'shipped'
  if (['delivered', 'completed'].includes(providerStatus)) return 'delivered'
  if (['returned', 'return_to_sender', 'returned_to_sender'].includes(providerStatus)) return 'returned'
  if (['cancelled', 'canceled'].includes(providerStatus)) return 'cancelled'
  return null
}

function canApply(current: string, incoming: StatusKey) {
  if (current === 'cancelled' || current === 'returned') return current === incoming
  if (current === 'delivered') return incoming === 'delivered' || incoming === 'returned'
  if (current === 'shipped') return incoming === 'shipped' || incoming === 'delivered' || incoming === 'returned'
  if (current === 'preparing' && incoming === 'returned') return false
  return true
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

async function restoreStock(tx: Tx, orderId: number) {
  const [items, exchanges] = await Promise.all([
    tx.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    tx.select().from(orderExchanges).where(eq(orderExchanges.orderId, orderId)),
  ])
  const changes = new Map<string, { modelId: number; color: string; delta: number }>()
  const add = (modelId: number | null, color: string | null, delta: number) => {
    if (!modelId) return
    if (!color) throw new Error('لا يمكن إرجاع الطلب للمخزون: أحد أسطر الطلب لا يحتوي على لون محفوظ.')
    const key = `${modelId}\u0000${color}`
    const current = changes.get(key)
    if (current) current.delta += delta
    else changes.set(key, { modelId, color, delta })
  }
  for (const item of items) add(item.modelId, item.color, item.quantity)
  for (const exchange of exchanges) {
    add(exchange.newModelId, exchange.newColor, exchange.newQty)
    add(exchange.returnedModelId, exchange.returnedColor, -exchange.returnedQty)
  }
  for (const change of changes.values()) {
    if (!change.delta) continue
    const updated = await tx.update(modelColors)
      .set({ stock: sql`${modelColors.stock} + ${change.delta}` })
      .where(and(
        eq(modelColors.modelId, change.modelId),
        eq(modelColors.color, change.color),
        sql`${modelColors.stock} >= ${Math.max(0, -change.delta)}`,
      ))
      .returning({ id: modelColors.id })
    if (updated.length !== 1) throw new Error('تعذر تحديث المخزون عند تسجيل الشحنة كملغي/راجع.')
  }
}

async function synchronize(token: string) {
  const [courier] = await db.select().from(couriers).where(eq(couriers.integrationKey, 'opost')).limit(1)
  if (!courier?.active || !courier.apiEnabled) throw new Error('شركة Opost غير مفعّلة أو ربط API متوقف.')
  const linkedOrders = await db.select({
    id: orders.id,
    status: orders.status,
    trackingNumber: orders.trackingNumber,
    externalShipmentId: orders.externalShipmentId,
    shippingProviderStatus: orders.shippingProviderStatus,
  }).from(orders).where(and(
    eq(orders.courierId, courier.id),
    sql`(${orders.trackingNumber} IS NOT NULL OR ${orders.externalShipmentId} IS NOT NULL)`,
  ))
  if (!linkedOrders.length) return { pagesRead: 0, totalShipments: 0, matched: 0, changed: 0, unchanged: 0, unmatched: 0 }

  const fetched = await fetchAllShipments(token)
  const byTracking = new Map(linkedOrders.filter(o => o.trackingNumber).map(o => [o.trackingNumber!, o]))
  const byExternalId = new Map(linkedOrders.filter(o => o.externalShipmentId).map(o => [o.externalShipmentId!, o]))
  const matched = new Map<number, ReturnType<typeof shipmentDetails>>()
  for (const row of fetched.shipments) {
    const detail = shipmentDetails(row)
    const order = (detail.shipmentId ? byExternalId.get(detail.shipmentId) : undefined)
      ?? (detail.tracking ? byTracking.get(detail.tracking) : undefined)
    if (order && detail.status) matched.set(order.id, detail)
  }

  let changed = 0
  let unchanged = 0
  for (const order of linkedOrders) {
    const detail = matched.get(order.id)
    if (!detail) continue
    const incoming = orderStatusFor(detail.status)
    const nextStatus = incoming && canApply(order.status, incoming) ? incoming : null
    const statusChanged = order.shippingProviderStatus !== detail.status
    const now = new Date()
    const eventIdentity = detail.eventId || `${detail.shipmentId}|${detail.tracking}|${detail.status}|${detail.occurred}|${detail.label}`
    const externalEventId = createHash('sha256').update(eventIdentity).digest('hex')

    await db.transaction(async tx => {
      const [current] = await tx.select().from(orders).where(eq(orders.id, order.id)).for('update')
      if (!current) return
      const [inserted] = await tx.insert(orderShippingStatusHistory).values({
        orderId: current.id,
        providerKey: 'opost',
        providerStatus: detail.status,
        providerLabel: detail.label,
        orderStatus: nextStatus ?? current.status,
        source: 'poll',
        externalEventId,
        occurredAt: detail.occurred && !Number.isNaN(Date.parse(detail.occurred)) ? new Date(detail.occurred) : null,
      }).onConflictDoNothing().returning({ id: orderShippingStatusHistory.id })

      const wasInactive = INACTIVE_STATUSES.includes(current.status as StatusKey)
      const becomesInactive = Boolean(nextStatus && INACTIVE_STATUSES.includes(nextStatus))
      if (inserted && nextStatus && nextStatus !== current.status) {
        if (!wasInactive && becomesInactive) await restoreStock(tx, current.id)
        const leftWarehouse = nextStatus === 'shipped' || nextStatus === 'delivered' || nextStatus === 'returned'
        await tx.update(orders).set({
          status: nextStatus,
          shippedAt: leftWarehouse ? current.shippedAt ?? now : current.shippedAt,
          deliveredAt: nextStatus === 'delivered' ? current.deliveredAt ?? now : null,
          shippingProviderStatus: detail.status,
          shippingSyncedAt: now,
          shippingError: null,
          syncStatus: 'synced',
          syncError: null,
          lastSyncedAt: now,
        }).where(eq(orders.id, current.id))
        changed += 1
      } else {
        await tx.update(orders).set({
          shippingProviderStatus: detail.status,
          shippingSyncedAt: now,
          shippingError: null,
          syncStatus: current.syncStatus === 'sent' ? 'synced' : current.syncStatus,
          lastSyncedAt: now,
        }).where(eq(orders.id, current.id))
        if (statusChanged || inserted) unchanged += 1
      }
    })
  }

  return {
    pagesRead: fetched.pagesRead,
    totalShipments: fetched.total,
    matched: matched.size,
    changed,
    unchanged,
    unmatched: Math.max(linkedOrders.length - matched.size, 0),
  }
}

async function run(request: NextRequest) {
  const token = process.env.OPOST_ACCESS_TOKEN
  if (!token) return NextResponse.json({ ok: false, error: 'رمز اتصال Opost غير مضبوط في هذه البيئة.' }, { status: 503 })
  try {
    const result = await synchronize(token)
    return NextResponse.json({ ok: true, message: 'اكتملت مزامنة حالات Opost.', ...result }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 400) : 'تعذرت مزامنة حالات Opost.'
    return NextResponse.json({ ok: false, error: message }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }
}

export async function POST() {
  const user = await authorizeRole('admin')
  if (!user) return NextResponse.json({ ok: false, error: 'يلزم تسجيل دخول المدير.' }, { status: 401 })
  return run(new NextRequest('https://internal.local/api/admin/opost/sync', { method: 'POST' }))
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const supplied = request.headers.get('authorization') || ''
  if (!secret || supplied !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  return run(request)
}
