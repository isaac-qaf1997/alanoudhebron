'use server'

import { and, eq, inArray, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { authorizeRole, type CurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import {
  couriers,
  modelColors,
  models,
  orderExchanges,
  orderItems,
  orders,
} from '@/lib/db/schema'
import {
  INACTIVE_STATUSES,
  REGIONS,
  courierFeeFor,
  isRegion,
  isStatus,
  type StatusKey,
} from '@/lib/constants'

export type ActionResult = { ok: true; warning?: string } | { ok: false; error: string }

class UserError extends Error {}

const MAX_QTY = 500

function text(value: unknown, max = 200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function imageUrl(value: unknown) {
  const candidate = text(value, 2048)
  if (!candidate) return null
  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== 'https:') throw new Error('invalid protocol')
    return parsed.toString()
  } catch {
    throw new UserError('رابط الصورة غير صالح')
  }
}

function amount(value: unknown) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) throw new UserError('قيمة مالية غير صالحة')
  return Math.round(n * 100) / 100
}

function qty(value: unknown, allowZero = false) {
  const n = Number(value)
  if (!Number.isInteger(n) || n < (allowZero ? 0 : 1) || n > MAX_QTY * 20) {
    throw new UserError('كمية غير صالحة')
  }
  return n
}

function id(value: unknown) {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) throw new UserError('معرّف غير صالح')
  return n
}

async function run(
  fn: (user: CurrentUser) => Promise<void | string>,
  minimumRole: 'admin' | 'staff' = 'admin',
): Promise<ActionResult> {
  try {
    const user = await authorizeRole(minimumRole)
    if (!user) return { ok: false, error: 'انتهت الجلسة أو لا تملكين صلاحية تنفيذ هذه العملية. سجّلي الدخول مجدداً.' }
    const warning = await fn(user)
    revalidatePath('/', 'layout')
    return warning ? { ok: true, warning } : { ok: true }
  } catch (error) {
    if (error instanceof UserError) return { ok: false, error: error.message }
    console.error('[actions]', error)
    return { ok: false, error: 'حدث خطأ غير متوقع، حاولي مرة أخرى' }
  }
}

/* ---------------------------------- Models --------------------------------- */

export async function createModel(input: {
  name: string
  sku?: string
  price: number
  cost: number
  imageUrl?: string | null
  colors: { color: string; stock: number; imageUrl?: string | null }[]
}) {
  return run(async () => {
    const name = text(input.name)
    if (!name) throw new UserError('اسم الموديل مطلوب')
    const colors = (input.colors ?? [])
      .map((c) => ({ color: text(c.color, 60), stock: qty(c.stock, true), imageUrl: imageUrl(c.imageUrl) }))
      .filter((c) => c.color)
    if (colors.length === 0) throw new UserError('أضيفي لوناً واحداً على الأقل')
    if (new Set(colors.map((c) => c.color)).size !== colors.length) {
      throw new UserError('يوجد لون مكرر')
    }
    await db.transaction(async (tx) => {
      const [model] = await tx
        .insert(models)
        .values({
          name,
          sku: text(input.sku, 60) || null,
          price: amount(input.price),
          cost: amount(input.cost),
          imageUrl: imageUrl(input.imageUrl),
        })
        .returning({ id: models.id })
      await tx.insert(modelColors).values(colors.map((c) => ({ ...c, modelId: model.id })))
    })
  })
}

export async function updateModel(
  modelId: number,
  input: { name: string; sku?: string; price: number; cost: number; imageUrl?: string | null },
) {
  return run(async () => {
    const name = text(input.name)
    if (!name) throw new UserError('اسم الموديل مطلوب')
    await db
      .update(models)
      .set({
        name,
        sku: text(input.sku, 60) || null,
        price: amount(input.price),
        cost: amount(input.cost),
        imageUrl: imageUrl(input.imageUrl),
      })
      .where(eq(models.id, id(modelId)))
  })
}

export async function deleteModel(modelId: number) {
  return run(async () => {
    const mid = id(modelId)
    await db.transaction(async (tx) => {
      await tx.delete(modelColors).where(eq(modelColors.modelId, mid))
      await tx.delete(models).where(eq(models.id, mid))
    })
  })
}

export async function addModelColor(modelId: number, color: string, stock: number, image?: string | null) {
  return run(async () => {
    const name = text(color, 60)
    if (!name) throw new UserError('اسم اللون مطلوب')
    const mid = id(modelId)
    const existing = await db.select().from(modelColors).where(eq(modelColors.modelId, mid))
    if (existing.some((c) => c.color === name)) throw new UserError('هذا اللون موجود مسبقاً')
    await db.insert(modelColors).values({ modelId: mid, color: name, stock: qty(stock, true), imageUrl: imageUrl(image) })
  })
}

export async function updateModelColorImage(colorId: number, image: string | null) {
  return run(async () => {
    await db.update(modelColors).set({ imageUrl: imageUrl(image) }).where(eq(modelColors.id, id(colorId)))
  })
}

export async function setColorStock(colorId: number, stock: number) {
  return run(async () => {
    await db.update(modelColors).set({ stock: qty(stock, true) }).where(eq(modelColors.id, id(colorId)))
  })
}

export async function deleteModelColor(colorId: number) {
  return run(async () => {
    await db.delete(modelColors).where(eq(modelColors.id, id(colorId)))
  })
}

/* --------------------------------- Couriers -------------------------------- */

type CourierInput = {
  name: string
  phone?: string
  feeWestBank: number
  feeJerusalem: number
  feeInside: number
  active?: boolean
  integrationKey?: string
}

function courierValues(input: CourierInput) {
  const name = text(input.name)
  if (!name) throw new UserError('اسم شركة التوصيل مطلوب')
  return {
    name,
    phone: text(input.phone, 40) || null,
    feeWestBank: amount(input.feeWestBank),
    feeJerusalem: amount(input.feeJerusalem),
    feeInside: amount(input.feeInside),
    active: input.active ?? true,
    integrationKey: text(input.integrationKey, 50).toLowerCase().replace(/[^a-z0-9_-]/g, '') || null,
  }
}

export async function createCourier(input: CourierInput) {
  return run(async () => {
    const values = courierValues(input)
    if (values.integrationKey) {
      const [duplicate] = await db.select({ id: couriers.id }).from(couriers).where(eq(couriers.integrationKey, values.integrationKey)).limit(1)
      if (duplicate) throw new UserError('مفتاح الربط مستخدم لشركة أخرى؛ اختاري مفتاحاً مختلفاً')
    }
    await db.insert(couriers).values(values)
  })
}

export async function updateCourier(courierId: number, input: CourierInput) {
  return run(async () => {
    const cid = id(courierId)
    const values = courierValues(input)
    if (values.integrationKey) {
      const [duplicate] = await db.select({ id: couriers.id }).from(couriers).where(and(eq(couriers.integrationKey, values.integrationKey), sql`${couriers.id} <> ${cid}`)).limit(1)
      if (duplicate) throw new UserError('مفتاح الربط مستخدم لشركة أخرى؛ اختاري مفتاحاً مختلفاً')
    }
    await db.update(couriers).set(values).where(eq(couriers.id, cid))
  })
}

export async function deleteCourier(courierId: number) {
  return run(async () => {
    const cid = id(courierId)
    await db.transaction(async (tx) => {
      await tx.update(orders).set({ courierId: null, courierFee: 0 }).where(eq(orders.courierId, cid))
      await tx.delete(couriers).where(eq(couriers.id, cid))
    })
  })
}

/* ---------------------------------- Orders --------------------------------- */

export type OrderInput = {
  customerName: string
  phone: string
  region: string
  city: string
  address?: string
  courierId?: number | null
  trackingNumber?: string
  notes?: string
  items: { modelId: number; color: string; quantity: number }[]
  exchanges: {
    returnedModelId: number
    returnedColor: string
    returnedQty: number
    newModelId: number
    newColor: string
    newQty: number
  }[]
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

async function adjustOrderStock(tx: Tx, orderId: number, direction: 1 | -1) {
  const [items, exchanges] = await Promise.all([
    tx.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    tx.select().from(orderExchanges).where(eq(orderExchanges.orderId, orderId)),
  ])
  const changes: { modelId: number | null; color: string | null; delta: number }[] = [
    ...items.map((i) => ({ modelId: i.modelId, color: i.color, delta: direction * i.quantity })),
    ...exchanges.flatMap((e) => [
      { modelId: e.newModelId, color: e.newColor, delta: direction * e.newQty },
      { modelId: e.returnedModelId, color: e.returnedColor, delta: -direction * e.returnedQty },
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

export async function createOrder(input: OrderInput) {
  return run(async () => {
    const customerName = text(input.customerName)
    const phone = text(input.phone, 30)
    const city = text(input.city, 80)
    const region = text(input.region, 20)
    if (!customerName) throw new UserError('اسم العميلة مطلوب')
    if (!/^[0-9+\-\s]{7,20}$/.test(phone)) throw new UserError('رقم الهاتف غير صالح')
    if (!city) throw new UserError('المدينة مطلوبة')
    if (!isRegion(region)) throw new UserError('اختاري منطقة التوصيل')

    const items = (input.items ?? []).map((i) => ({
      modelId: id(i.modelId),
      color: text(i.color, 60),
      quantity: qty(i.quantity),
    }))
    const exchanges = (input.exchanges ?? []).map((e) => ({
      returnedModelId: id(e.returnedModelId),
      returnedColor: text(e.returnedColor, 60),
      returnedQty: qty(e.returnedQty),
      newModelId: id(e.newModelId),
      newColor: text(e.newColor, 60),
      newQty: qty(e.newQty),
    }))
    if (items.length + exchanges.length === 0) throw new UserError('أضيفي منتجاً واحداً على الأقل')
    if (items.length > 50 || exchanges.length > 20) throw new UserError('عدد الأسطر كبير جداً')

    const totalQty =
      items.reduce((s, i) => s + i.quantity, 0) + exchanges.reduce((s, e) => s + e.newQty, 0)
    if (totalQty > MAX_QTY) throw new UserError(`الحد الأقصى ${MAX_QTY} قطعة في الطلب الواحد`)

    const courierId = input.courierId ? id(input.courierId) : null
    let createdOrderId: number | null = null

    await db.transaction(async (tx) => {
      const modelIds = [
        ...new Set([
          ...items.map((i) => i.modelId),
          ...exchanges.flatMap((e) => [e.returnedModelId, e.newModelId]),
        ]),
      ]
      const [modelRows, colorRows, courierRows] = await Promise.all([
        tx.select().from(models).where(inArray(models.id, modelIds)),
        tx.select().from(modelColors).where(inArray(modelColors.modelId, modelIds)),
        courierId ? tx.select().from(couriers).where(eq(couriers.id, courierId)) : Promise.resolve([]),
      ])
      if (courierId && courierRows.length === 0) throw new UserError('شركة التوصيل غير موجودة')

      const getModel = (mid: number) => {
        const model = modelRows.find((m) => m.id === mid)
        if (!model) throw new UserError('أحد الموديلات غير موجود')
        return model
      }
      const getColor = (mid: number, color: string, required: boolean) => {
        const row = colorRows.find((c) => c.modelId === mid && c.color === color)
        if (!row && required) throw new UserError(`اللون "${color || '—'}" غير متوفر لموديل ${getModel(mid).name}`)
        return row
      }

      const stockNeeded = new Map<number, number>()
      const need = (colorId: number, delta: number) =>
        stockNeeded.set(colorId, (stockNeeded.get(colorId) ?? 0) + delta)

      let itemsTotal = 0
      let costTotal = 0

      const itemRows = items.map((item) => {
        const model = getModel(item.modelId)
        const color = getColor(item.modelId, item.color, true)!
        need(color.id, item.quantity)
        itemsTotal += model.price * item.quantity
        costTotal += model.cost * item.quantity
        return {
          modelId: model.id,
          modelName: model.name,
          color: item.color,
          quantity: item.quantity,
          unitPrice: model.price,
          unitCost: model.cost,
        }
      })

      let exchangeDiff = 0
      const exchangeRows = exchanges.map((ex) => {
        const returned = getModel(ex.returnedModelId)
        const replacement = getModel(ex.newModelId)
        const newColor = getColor(ex.newModelId, ex.newColor, true)!
        need(newColor.id, ex.newQty)
        const returnedColor = getColor(ex.returnedModelId, ex.returnedColor, false)
        if (returnedColor) need(returnedColor.id, -ex.returnedQty)
        const diff = replacement.price * ex.newQty - returned.price * ex.returnedQty
        exchangeDiff += diff
        costTotal += replacement.cost * ex.newQty - returned.cost * ex.returnedQty
        return {
          returnedModelId: returned.id,
          returnedName: returned.name,
          returnedColor: ex.returnedColor || null,
          returnedQty: ex.returnedQty,
          returnedPrice: returned.price,
          returnedCost: returned.cost,
          newModelId: replacement.id,
          newName: replacement.name,
          newColor: ex.newColor,
          newQty: ex.newQty,
          newPrice: replacement.price,
          newCost: replacement.cost,
          diff,
        }
      })

      for (const [colorId, needed] of stockNeeded) {
        const row = colorRows.find((c) => c.id === colorId)!
        if (needed > 0 && row.stock < needed) {
          const model = getModel(row.modelId)
          throw new UserError(`المخزون غير كافٍ: ${model.name} (${row.color}) — المتوفر ${row.stock}`)
        }
      }

      for (const [colorId, needed] of stockNeeded) {
        if (needed === 0) continue
        await tx
          .update(modelColors)
          .set({ stock: sql`${modelColors.stock} - ${needed}` })
          .where(eq(modelColors.id, colorId))
      }

      const shippingFee = REGIONS[region].fee
      const [order] = await tx
        .insert(orders)
        .values({
          customerName,
          phone,
          region,
          city,
          address: text(input.address, 300) || null,
          courierId,
          trackingNumber: text(input.trackingNumber, 80) || null,
          notes: text(input.notes, 500) || null,
          itemsTotal,
          shippingFee,
          exchangeDiff,
          total: Math.max(itemsTotal + shippingFee + exchangeDiff, 0),
          costTotal,
          courierFee: courierFeeFor(courierRows[0], region),
        })
        .returning({ id: orders.id })
      createdOrderId = order.id

      if (itemRows.length) await tx.insert(orderItems).values(itemRows.map((r) => ({ ...r, orderId: order.id })))
      if (exchangeRows.length) {
        await tx.insert(orderExchanges).values(exchangeRows.map((r) => ({ ...r, orderId: order.id })))
      }
    })

    // If a courier with an active API integration was selected at registration, send immediately.
    if (createdOrderId && courierId) {
      const { dispatchShipment } = await import('@/lib/shipping/dispatch')
      await dispatchShipment(createdOrderId)
    }
  }, 'staff')
}

export async function updateOrderStatus(orderId: number, status: string) {
  return run(async () => {
    if (!isStatus(status)) throw new UserError('حالة غير صالحة')
    const oid = id(orderId)
    await db.transaction(async (tx) => {
      const [current] = await tx.select().from(orders).where(eq(orders.id, oid))
      if (!current) throw new UserError('الطلب غير موجود')
      const wasInactive = INACTIVE_STATUSES.includes(current.status as StatusKey)
      const isInactive = INACTIVE_STATUSES.includes(status)
      if (!wasInactive && isInactive) await adjustOrderStock(tx, oid, 1)
      if (wasInactive && !isInactive) await adjustOrderStock(tx, oid, -1)

      const now = new Date()
      const leftWarehouse = status === 'shipped' || status === 'delivered' || status === 'returned'
      await tx
        .update(orders)
        .set({
          status,
          shippedAt: leftWarehouse ? (current.shippedAt ?? now) : status === 'preparing' ? null : current.shippedAt,
          deliveredAt: status === 'delivered' ? (current.deliveredAt ?? now) : null,
        })
        .where(eq(orders.id, oid))
    })
  }, 'staff')
}

export async function updateShipping(
  orderId: number,
  input: { courierId: number | null; region: string; trackingNumber?: string },
) {
  return run(async () => {
    const oid = id(orderId)
    const region = text(input.region, 20)
    if (!isRegion(region)) throw new UserError('منطقة غير صالحة')
    const courierId = input.courierId ? id(input.courierId) : null
    const [current] = await db.select().from(orders).where(eq(orders.id, oid))
    if (!current) throw new UserError('الطلب غير موجود')
    const courier = courierId ? (await db.select().from(couriers).where(eq(couriers.id, courierId)))[0] : null
    if (courierId && !courier) throw new UserError('شركة التوصيل غير موجودة')
    const shippingFee = REGIONS[region].fee
    await db
      .update(orders)
      .set({
        courierId,
        region,
        trackingNumber: text(input.trackingNumber, 80) || null,
        externalShipmentId: courierId === current.courierId ? current.externalShipmentId : null,
        syncStatus: courierId === current.courierId ? current.syncStatus : 'not_configured',
        syncError: courierId === current.courierId ? current.syncError : null,
        shippingFee,
        total: Math.max(current.itemsTotal + shippingFee + current.exchangeDiff, 0),
        courierFee: courierFeeFor(courier, region),
      })
      .where(eq(orders.id, oid))
    if (courierId && (courierId !== current.courierId || !['sent', 'synced'].includes(current.syncStatus))) {
      const { dispatchShipment } = await import('@/lib/shipping/dispatch')
      await dispatchShipment(oid)
    }
  }, 'staff')
}

export async function retryShippingSync(orderId: number) {
  return run(async () => {
    const oid = id(orderId)
    const [order] = await db.select().from(orders).where(eq(orders.id, oid))
    if (!order) throw new UserError('الطلب غير موجود')
    if (!order.courierId) throw new UserError('عيّني شركة توصيل أولاً')
    if (order.syncStatus !== 'failed') throw new UserError('إعادة المحاولة متاحة للشحنات التي فشل إرسالها فقط')
    const { dispatchShipment } = await import('@/lib/shipping/dispatch')
    await dispatchShipment(oid)
    const [updated] = await db.select().from(orders).where(eq(orders.id, oid))
    if (updated?.syncStatus === 'failed') throw new UserError(updated.syncError || 'تعذر إرسال الشحنة')
  }, 'staff')
}

export async function bulkShip(orderIds: number[]) {
  return run(async () => {
    const ids = [...new Set(orderIds.map(id))]
    if (ids.length === 0) return
    const eligible = await db.select({ id: orders.id }).from(orders).where(
      sql`${inArray(orders.id, ids)} and ${orders.status} = 'preparing' and ${orders.courierId} is not null`,
    )
    await db
      .update(orders)
      .set({ status: 'shipped', shippedAt: sql`coalesce(${orders.shippedAt}, now())` })
      .where(sql`${inArray(orders.id, ids)} and ${orders.status} = 'preparing'`)
    // Dispatch is best-effort: orders remain saved even if a carrier API is temporarily unavailable.
    const { dispatchShipment } = await import('@/lib/shipping/dispatch')
    for (const order of eligible) await dispatchShipment(order.id)
  }, 'staff')
}

export async function deleteOrder(orderId: number) {
  return run(async () => {
    const oid = id(orderId)
    await db.transaction(async (tx) => {
      const [current] = await tx.select().from(orders).where(eq(orders.id, oid))
      if (!current) return
      if (!INACTIVE_STATUSES.includes(current.status as StatusKey)) await adjustOrderStock(tx, oid, 1)
      await tx.delete(orderItems).where(eq(orderItems.orderId, oid))
      await tx.delete(orderExchanges).where(eq(orderExchanges.orderId, oid))
      await tx.delete(orders).where(eq(orders.id, oid))
    })
  })
}
