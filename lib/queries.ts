import { and, asc, desc, eq, inArray, isNotNull, sql, type SQL } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'
import { db } from '@/lib/db'
import {
  couriers,
  coupons,
  modelColors,
  modelSizes,
  models,
  orderExchanges,
  orderItems,
  orders,
  type Order,
  type CourierPublic,
} from '@/lib/db/schema'

const localDate = (column: PgColumn) => sql`(${column} at time zone 'Asia/Hebron')::date`

export async function getModels() {
  const [modelRows, colorRows, sizeRows] = await Promise.all([
    db.select().from(models).orderBy(desc(models.createdAt)),
    db.select().from(modelColors).orderBy(asc(modelColors.id)),
    db.select().from(modelSizes).orderBy(asc(modelSizes.id)),
  ])
  return modelRows.map((model) => ({
    id: model.id,
    name: model.name,
    sku: model.sku,
    price: model.price,
    cost: model.cost,
    imageUrl: model.imageUrl,
    isPublished: model.isPublished,
    createdAt: model.createdAt,
    colors: colorRows.filter((c) => c.modelId === model.id).map((color) => ({
      ...color,
      sizes: sizeRows.filter((size) => size.modelColorId === color.id),
    })),
  }))
}

export type ModelWithColors = Awaited<ReturnType<typeof getModels>>[number]

export async function getCouriers(): Promise<CourierPublic[]> {
  const rows = await db.select().from(couriers).orderBy(asc(couriers.id))
  return rows.map(({ apiKeyEncrypted, secretTokenEncrypted, integrationKey, ...courier }) => ({
    id: courier.id, name: courier.name, phone: courier.phone, integrationKey,
    feeWestBank: courier.feeWestBank, feeJerusalem: courier.feeJerusalem,
    feeArea67: courier.feeArea67, feeInside: courier.feeInside, active: courier.active, createdAt: courier.createdAt,
    apiBaseUrl: courier.apiBaseUrl, apiEnabled: courier.apiEnabled,
    sendOnOrderCreate: courier.sendOnOrderCreate,
    hasApiKey: Boolean(apiKeyEncrypted), hasSecretToken: Boolean(secretTokenEncrypted),
  }))
}

async function hydrateOrders(rows: Order[]) {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)
  const [items, exchanges, courierRows] = await Promise.all([
    db.select().from(orderItems).where(inArray(orderItems.orderId, ids)).orderBy(asc(orderItems.id)),
    db
      .select()
      .from(orderExchanges)
      .where(inArray(orderExchanges.orderId, ids))
      .orderBy(asc(orderExchanges.id)),
    getCouriers(),
  ])
  return rows.map((order) => ({
    ...order,
    items: items.filter((i) => i.orderId === order.id),
    exchanges: exchanges.filter((e) => e.orderId === order.id),
    courierName: courierRows.find((c) => c.id === order.courierId)?.name ?? null,
  }))
}

export type OrderFull = Awaited<ReturnType<typeof hydrateOrders>>[number]

async function selectOrders(where?: SQL) {
  const query = db.select().from(orders)
  const rows = await (where ? query.where(where) : query).orderBy(desc(orders.createdAt)).limit(1000)
  return hydrateOrders(rows)
}

export async function getOrders() {
  return selectOrders()
}

export async function getOrdersInRange(from: string, to: string) {
  return selectOrders(
    sql`${localDate(orders.createdAt)} between ${from}::date and ${to}::date`,
  )
}

export async function getDeliverySheet(date: string, courierId: number | null) {
  const conditions: SQL[] = [
    isNotNull(orders.shippedAt) as SQL,
    sql`${localDate(orders.shippedAt)} = ${date}::date`,
  ]
  if (courierId) conditions.push(eq(orders.courierId, courierId))
  const rows = await selectOrders(and(...conditions))
  return rows.sort((a, b) => a.id - b.id)
}

export async function getCoupons() {
  return db.select().from(coupons).orderBy(desc(coupons.createdAt))
}
