import { and, eq, inArray, isNull, lt, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { INACTIVE_STATUSES } from '@/lib/constants'
import { couriers, orderExchanges, orderItems, orders } from '@/lib/db/schema'

const BASE = 'https://o.opost.ps'
const BUSINESS_ID = process.env.OPOST_BUSINESS_ID || '586'
const BUSINESS_ADDRESS_ID = process.env.OPOST_BUSINESS_ADDRESS_ID || '588'
const SHIPMENT_TYPE_ID = process.env.OPOST_SHIPMENT_TYPE_ID || '1'

type ApiRecord = Record<string, unknown>
function records(payload: unknown): ApiRecord[] {
  if (Array.isArray(payload)) {
    if (payload.length === 1 && payload[0] && typeof payload[0] === 'object' && 'data' in (payload[0] as ApiRecord)) {
      return records(payload[0])
    }
    return payload as ApiRecord[]
  }
  if (!payload || typeof payload !== 'object') return []
  const obj = payload as ApiRecord
  for (const key of ['data', 'results', 'cities', 'areas']) {
    if (Array.isArray(obj[key])) return obj[key] as ApiRecord[]
    if (obj[key] && typeof obj[key] === 'object') {
      const nested = records(obj[key])
      if (nested.length) return nested
    }
  }
  return []
}
function nextPageUrl(payload: unknown): string | null {
  const root = Array.isArray(payload) && payload.length === 1 ? payload[0] : payload
  if (!root || typeof root !== 'object') return null
  const pagination = (root as ApiRecord).pagination
  if (!pagination || typeof pagination !== 'object') return null
  const next = (pagination as ApiRecord).next_page_url
  return typeof next === 'string' && next.trim() ? next : null
}
async function allRecords(path: string, token: string): Promise<ApiRecord[]> {
  let nextUrl = new URL(path, BASE).toString()
  const visited = new Set<string>()
  const collected: ApiRecord[] = []
  for (let page = 0; page < 100 && nextUrl; page += 1) {
    const parsed = new URL(nextUrl, BASE)
    if (parsed.origin !== BASE || !parsed.pathname.startsWith('/api/resources/')) {
      throw new Error('رابط صفحة بيانات Opost غير موثوق.')
    }
    const url = parsed.toString()
    if (visited.has(url)) throw new Error('تكرار غير متوقع في صفحات بيانات Opost.')
    visited.add(url)
    const payload = await apiGet(url, token)
    collected.push(...records(payload))
    const candidate = nextPageUrl(payload)
    if (!candidate) return collected
    const next = new URL(candidate, BASE)
    if (next.origin !== BASE || !next.pathname.startsWith('/api/resources/')) {
      throw new Error('رابط الصفحة التالية في Opost غير صالح.')
    }
    nextUrl = next.toString()
  }
  if (nextUrl) throw new Error('تجاوز جلب بيانات Opost الحد الآمن لعدد الصفحات (100 صفحة).')
  return collected
}
function label(row: ApiRecord): string {
  return String(
    row.name ?? row.title ?? row.label ?? row.ar_name ?? row.name_ar ??
    row.area_name ?? row.areaName ?? row.name_arabic ?? row.arabic_name ??
    row.name_en ?? row.english_name ?? row.area ?? ''
  ).trim()
}
function idOf(row: ApiRecord): string {
  return String(row.id ?? row.value ?? row.area_id ?? row.areaId ?? '').trim()
}
function norm(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(/[\u064B-\u065F\u0670]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[\s_-]+/g, ' ').trim()
}
async function apiGet(path: string, token: string): Promise<unknown> {
  const response = await fetch(new URL(path, BASE), {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store', signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) throw new Error(`Opost lookup failed: HTTP ${response.status}`)
  return response.json()
}
async function resolveLocation(cityName: string, areaName: string, token: string) {
  const cities = await allRecords('/api/resources/cities', token)
  const city = cities.find(row => norm(label(row)) === norm(cityName))
  if (!city || !idOf(city)) throw new Error(`لم أتمكن من مطابقة مدينة "${cityName}" في قائمة Opost. راجعي اسم المدينة.`)
  const areas = await allRecords(`/api/resources/areas?city=${encodeURIComponent(idOf(city))}`, token)
  let area = areas.find(row => norm(label(row)) === norm(areaName))

  // If both city and area are entered as Hebron, accept only an exact
  // city-centre label returned by Opost for that selected city.
  if (!area && norm(cityName) === norm('الخليل') && norm(areaName) === norm(cityName)) {
    const confirmedHebronAliases = new Set(['مدينة الخليل', 'الخليل المدينة', 'hebron city'])
    area = areas.find(row => confirmedHebronAliases.has(norm(label(row))))
  }

  if (!area || !idOf(area)) {
    const suggestions = areas
      .map(row => label(row))
      .filter(name => name && (norm(name).includes(norm('خليل')) || norm(name).includes('hebron')))
      .slice(0, 8)
    const suffix = suggestions.length ? ` المناطق المسجلة المشابهة: ${suggestions.join('، ')}.` : ''
    throw new Error(`منطقة "${areaName}" غير موجودة ضمن مدينة "${cityName}" في Opost.${suffix} لن نرسل عنواناً غير مؤكد.`)
  }
  return { cityId: idOf(city), areaId: idOf(area) }
}

/** Opost requires multipart/form-data. This adapter deliberately refuses to guess city/area IDs. */
export async function dispatchOpostShipment(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
  if (!order?.courierId) return
  if (INACTIVE_STATUSES.includes(order.status as (typeof INACTIVE_STATUSES)[number])) return
  if (order.syncStatus === 'sent' || order.syncStatus === 'synced') return
  const [courier] = await db.select().from(couriers).where(eq(couriers.id, order.courierId))
  if (!courier?.active || !courier.apiEnabled || courier.integrationKey !== 'opost') return
  const token = process.env.OPOST_ACCESS_TOKEN
  if (!token) {
    await db.update(orders).set({ syncStatus: 'not_configured', syncError: 'إعداد Opost ناقص: OPOST_ACCESS_TOKEN' }).where(eq(orders.id, orderId))
    return
  }
  const now = new Date()
  const stale = new Date(now.getTime() - 5 * 60 * 1000)
  const [claim] = await db.update(orders).set({ syncStatus: 'sending', syncError: null, lastSyncedAt: now })
    .where(and(eq(orders.id, orderId), or(inArray(orders.syncStatus, ['not_configured', 'failed']), and(eq(orders.syncStatus, 'sending'), or(isNull(orders.lastSyncedAt), lt(orders.lastSyncedAt, stale))))))
    .returning({ id: orders.id })
  if (!claim) return

  try {
    if (!order.area) throw new Error('الطلب لا يحتوي على المنطقة/الحي بشكل منفصل؛ أضيفيها قبل إرسال الشحنة.')
    const location = await resolveLocation(order.city, order.area, token)
    const [items, exchangeItems] = await Promise.all([
      db.select({ quantity: orderItems.quantity }).from(orderItems).where(eq(orderItems.orderId, orderId)),
      db.select({ quantity: orderExchanges.newQty }).from(orderExchanges).where(eq(orderExchanges.orderId, orderId)),
    ])
    const quantity = [...items, ...exchangeItems].reduce((sum, item) => sum + item.quantity, 0)
    if (quantity <= 0) throw new Error('Order has no shippable items')

    const codAmount = Math.max(Number(order.total) - Number(order.amountPaid || 0), 0)
    const form = new FormData()
    form.set('business', BUSINESS_ID)
    form.set('business_address', BUSINESS_ADDRESS_ID)
    form.set('consignee[name]', order.customerName)
    form.set('consignee[phone]', order.phone)
    form.set('consignee[city]', location.cityId)
    form.set('consignee[area]', location.areaId)
    form.set('consignee[address]', order.address || order.area)
    form.set('shipment_types[0][id]', SHIPMENT_TYPE_ID)
    form.set('quantity', String(quantity))
    form.set('items_description', 'ملابس')
    form.set('is_cod', codAmount > 0 ? '1' : '0')
    form.set('width', process.env.OPOST_DEFAULT_WIDTH || '10')
    form.set('height', process.env.OPOST_DEFAULT_HEIGHT || '10')
    form.set('length', process.env.OPOST_DEFAULT_LENGTH || '10')
    form.set('cod_amount', codAmount.toFixed(2))

    const response = await fetch(new URL('/api/resources/shipments', BASE), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Idempotency-Key': `alanoud-order-${order.id}` },
      body: form, signal: AbortSignal.timeout(20000),
    })
    const result = await response.json().catch(() => ({})) as ApiRecord
    if (!response.ok) throw new Error(`Opost API HTTP ${response.status}: ${JSON.stringify(result).slice(0, 350)}`)
    const data = (result.data && typeof result.data === 'object' ? result.data : result) as ApiRecord
    const shipmentId = data.id ?? data.shipment_id ?? data.shipmentId
    const tracking = data.tracking_number ?? data.trackingNumber ?? data.tracking_code
    if (shipmentId == null && tracking == null) throw new Error('استجابة Opost لا تحتوي رقم شحنة أو رقم تتبع واضح.')
    await db.update(orders).set({
      externalShipmentId: shipmentId == null ? null : String(shipmentId),
      trackingNumber: tracking == null ? order.trackingNumber : String(tracking),
      syncStatus: 'sent', syncError: null, lastSyncedAt: new Date(),
    }).where(and(eq(orders.id, orderId), eq(orders.syncStatus, 'sending')))
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : 'Opost request failed'
    await db.update(orders).set({ syncStatus: 'failed', syncError: message, lastSyncedAt: new Date() }).where(and(eq(orders.id, orderId), eq(orders.syncStatus, 'sending')))
    console.error(`[opost] dispatch failed for order ${orderId}`, error)
  }
}
