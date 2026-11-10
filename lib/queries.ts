import { and, asc, desc, eq, inArray, isNotNull, sql, type SQL } from 'drizzle-orm'
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

export async function getModels() {
  const [modelRows, colorRows, sizeRows] = await Promise.all([
    db.select().from(models).orderBy(desc(models.createdAt)),
    db.select().from(modelColors).orderBy(asc(modelColors.id)),
    db.select().from(modelSizes).orderBy(asc(modelSizes.id)),
  ])
  const colorsByModel = new Map<number, typeof colorRows>()
  const sizesByColor = new Map<number, typeof sizeRows>()
  for (const color of colorRows) {
    const list = colorsByModel.get(color.modelId) ?? []
    list.push(color)
    colorsByModel.set(color.modelId, list)
  }
  for (const size of sizeRows) {
    const list = sizesByColor.get(size.modelColorId) ?? []
    list.push(size)
    sizesByColor.set(size.modelColorId, list)
  }

  return modelRows.map((model) => ({
    id: model.id,
    name: model.name,
    category: model.category,
    sku: model.sku,
    price: model.price,
    cost: model.cost,
    imageUrl: model.imageUrl,
    galleryUrls: model.galleryUrls ?? [],
    isPublished: model.isPublished,
    createdAt: model.createdAt,
    colors: (colorsByModel.get(model.id) ?? []).map((color) => ({
      ...color,
      galleryUrls: color.galleryUrls ?? [],
      sizes: sizesByColor.get(color.id) ?? [],
    })),
  }))
}

export type ModelWithColors = Awaited<ReturnType<typeof getModels>>[number]

export type StoreProduct = {
  id: number
  name: string
  category: string
  price: number
  imageUrl: string | null
  galleryUrls: string[]
  colors: {
    id: number
    color: string
    stock: number | null
    imageUrl: string | null
    galleryUrls: string[]
    sizes: { id: number; size: string; stock: number | null }[]
  }[]
}

// One joined query replaces three sequential database round trips on public storefront pages.
export async function getStoreProducts(productId?: number): Promise<StoreProduct[]> {
  const conditions = productId
    ? and(eq(models.isPublished, true), eq(models.id, productId))
    : eq(models.isPublished, true)

  const rows = await db.select({
    productId: models.id,
    productName: models.name,
    category: models.category,
    price: models.price,
    imageUrl: models.imageUrl,
    colorId: modelColors.id,
    color: modelColors.color,
    colorStock: modelColors.stock,
    colorImageUrl: modelColors.imageUrl,
    colorGalleryUrls: modelColors.galleryUrls,
    modelGalleryUrls: models.galleryUrls,
    sizeId: modelSizes.id,
    size: modelSizes.size,
    sizeStock: modelSizes.stock,
  }).from(models)
    .leftJoin(modelColors, eq(modelColors.modelId, models.id))
    .leftJoin(modelSizes, eq(modelSizes.modelColorId, modelColors.id))
    .where(conditions)
    .orderBy(desc(models.createdAt), asc(modelColors.id), asc(modelSizes.id))

  const products = new Map<number, StoreProduct>()
  const colors = new Map<number, StoreProduct['colors'][number]>()

  for (const row of rows) {
    let product = products.get(row.productId)
    if (!product) {
      product = {
        id: row.productId,
        name: row.productName,
        category: row.category,
        price: row.price,
        imageUrl: row.imageUrl,
        galleryUrls: row.modelGalleryUrls ?? [],
        colors: [],
      }
      products.set(row.productId, product)
    }

    if (row.colorId === null) continue
    let color = colors.get(row.colorId)
    if (!color) {
      color = {
        id: row.colorId,
        color: row.color!,
        stock: row.colorStock,
        imageUrl: row.colorImageUrl,
        galleryUrls: row.colorGalleryUrls ?? [],
        sizes: [],
      }
      colors.set(row.colorId, color)
      product.colors.push(color)
    }

    if (row.sizeId !== null) {
      color.sizes.push({
        id: row.sizeId,
        size: row.size!,
        stock: row.sizeStock,
      })
    }
  }

  return [...products.values()]
}

export async function getActiveCourierCount() {
  const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(couriers).where(eq(couriers.active, true))
  return result?.count ?? 0
}

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
  const itemsByOrder = new Map<number, typeof items>()
  const exchangesByOrder = new Map<number, typeof exchanges>()
  const courierNames = new Map(courierRows.map((courier) => [courier.id, courier.name]))
  for (const item of items) {
    const list = itemsByOrder.get(item.orderId) ?? []
    list.push(item)
    itemsByOrder.set(item.orderId, list)
  }
  for (const exchange of exchanges) {
    const list = exchangesByOrder.get(exchange.orderId) ?? []
    list.push(exchange)
    exchangesByOrder.set(exchange.orderId, list)
  }
  return rows.map((order) => ({
    ...order,
    items: itemsByOrder.get(order.id) ?? [],
    exchanges: exchangesByOrder.get(order.id) ?? [],
    courierName: courierNames.get(order.courierId ?? -1) ?? null,
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
    sql`${orders.createdAt} >= (${from}::date::timestamp AT TIME ZONE 'Asia/Hebron') AND ${orders.createdAt} < ((${to}::date + 1)::timestamp AT TIME ZONE 'Asia/Hebron')`,
  )
}

export async function getDeliverySheet(date: string, courierId: number | null) {
  const conditions: SQL[] = [
    isNotNull(orders.shippedAt) as SQL,
    sql`${orders.shippedAt} >= (${date}::date::timestamp AT TIME ZONE 'Asia/Hebron') AND ${orders.shippedAt} < ((${date}::date + 1)::timestamp AT TIME ZONE 'Asia/Hebron')`,
  ]
  if (courierId) conditions.push(eq(orders.courierId, courierId))
  const rows = await selectOrders(and(...conditions))
  return rows.sort((a, b) => a.id - b.id)
}

export async function getCoupons() {
  return db.select().from(coupons).orderBy(desc(coupons.createdAt))
}
