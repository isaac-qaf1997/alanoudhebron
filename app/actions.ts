'use server'

import { and, eq, inArray, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { authorizeRole, type CurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import {
  couriers,
  coupons,
  modelColors,
  models,
  orderExchanges,
  orderItems,
  orders,
} from '@/lib/db/schema'
import {
  CITY_REGIONS,
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


/* -------------------------------- Coupons ---------------------------------- */

export type CouponInput = {
  code: string
  discountType: 'fixed' | 'percentage'
  discountValue: number
  startsAt?: string
  expiresAt?: string
  usageLimit?: number | null
}

export async function createCoupon(input: CouponInput) {
  return run(async () => {
    const code = text(input.code, 32).toUpperCase()
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) throw new UserError('الكود يجب أن يتكون من 3 إلى 32 حرفاً أو رقماً')
    if (input.discountType !== 'fixed' && input.discountType !== 'percentage') throw new UserError('نوع الخصم غير صالح')
    const discountValue = amount(input.discountValue)
    if (discountValue <= 0 || (input.discountType === 'percentage' && discountValue > 100)) {
      throw new UserError(input.discountType === 'percentage' ? 'النسبة يجب أن تكون بين 1 و100%' : 'قيمة الخصم يجب أن تكون أكبر من صفر')
    }
    const startsAt = input.startsAt ? new Date(input.startsAt) : null
    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null
    if ((startsAt && Number.isNaN(startsAt.getTime())) || (expiresAt && Number.isNaN(expiresAt.getTime()))) throw new UserError('تاريخ الكوبون غير صالح')
    if (startsAt && expiresAt && expiresAt <= startsAt) throw new UserError('تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية')
    const usageLimit = input.usageLimit == null || input.usageLimit === 0 ? null : qty(input.usageLimit)
    const [existing] = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, code)).limit(1)
    if (existing) throw new UserError('هذا الكود موجود مسبقاً')
    await db.insert(coupons).values({ code, discountType: input.discountType, discountValue, startsAt, expiresAt, usageLimit })
  })
}

export async function setCouponActive(couponId: number, active: boolean) {
  return run(async () => {
    if (typeof active !== 'boolean') throw new UserError('حالة الكوبون غير صالحة')
    await db.update(coupons).set({ active }).where(eq(coupons.id, id(couponId)))
  })
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
    const normalizedColors = colors.map((c) => c.color.normalize('NFKC').trim().toLowerCase())
    if (new Set(normalizedColors).size !== colors.length) {
      throw new UserError('يوجد لون مكرر حتى لو اختلفت طريقة كتابة الحروف')
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
      const [usedItem] = await tx.select({ id: orderItems.id }).from(orderItems).where(eq(orderItems.modelId, mid)).limit(1)
      const [usedExchange] = await tx.select({ id: orderExchanges.id }).from(orderExchanges)
        .where(sql`${orderExchanges.returnedModelId} = ${mid} OR ${orderExchanges.newModelId} = ${mid}`).limit(1)
      if (usedItem || usedExchange) throw new UserError('لا يمكن حذف موديل مرتبط بسجل طلبات سابق. أوقفي عرضه أو اجعلي كمياته صفراً للحفاظ على سجل الطلبات والمخزون.')
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
    const existing = await db.select().from(modelColors).where(
      sql`${modelColors.modelId} = ${mid} AND lower(btrim(${modelColors.color})) = lower(btrim(${name}))`,
    )
    if (existing.length) throw new UserError('هذا اللون موجود مسبقاً')
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
    const cid = id(colorId)
    await db.transaction(async (tx) => {
      const [color] = await tx.select().from(modelColors).where(eq(modelColors.id, cid)).limit(1)
      if (!color) return
      const [usedItem] = await tx.select({ id: orderItems.id }).from(orderItems)
        .where(and(eq(orderItems.modelId, color.modelId), eq(orderItems.color, color.color))).limit(1)
      const [usedExchange] = await tx.select({ id: orderExchanges.id }).from(orderExchanges)
        .where(sql`(${orderExchanges.returnedModelId} = ${color.modelId} AND ${orderExchanges.returnedColor} = ${color.color}) OR (${orderExchanges.newModelId} = ${color.modelId} AND ${orderExchanges.newColor} = ${color.color})`).limit(1)
      if (usedItem || usedExchange) throw new UserError('لا يمكن حذف لون مرتبط بطلب سابق حتى لا يتأثر سجل المخزون. يمكنك إبقاء اللون وتصفير كميته.')
      await tx.delete(modelColors).where(eq(modelColors.id, cid))
    })
  })
}

/* --------------------------------- Couriers -------------------------------- */

type CourierInput = {
  name: string
  phone?: string
  feeWestBank: number
  feeJerusalem: number
  feeArea67: number
  feeInside: number
  active?: boolean
  integrationKey?: string
  apiEnabled?: boolean
  sendOnOrderCreate?: boolean
}

function courierValues(input: CourierInput) {
  const name = text(input.name)
  if (!name) throw new UserError('اسم شركة التوصيل مطلوب')
  const integrationKey = text(input.integrationKey, 50).toLowerCase().replace(/[^a-z0-9_-]/g, '') || null
  const apiEnabled = input.apiEnabled ?? false
  return {
    name,
    phone: text(input.phone, 40) || null,
    feeWestBank: amount(input.feeWestBank),
    feeJerusalem: amount(input.feeJerusalem),
    feeArea67: amount(input.feeArea67),
    feeInside: amount(input.feeInside),
    active: input.active ?? true,
    integrationKey,
    apiEnabled,
    sendOnOrderCreate: Boolean(input.sendOnOrderCreate && apiEnabled && integrationKey === 'opost'),
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
      await tx.update(orders).set({ courierId: null }).where(eq(orders.courierId, cid))
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
  area: string
  address?: string
  courierId?: number | null
  trackingNumber?: string
  notes?: string
  discount?: number
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
  const changes = new Map<string, { modelId: number; color: string; delta: number }>()
  const add = (modelId: number | null, color: string | null, delta: number) => {
    if (!modelId) return
    if (!color) throw new UserError('لا يمكن تحديث المخزون لأن أحد أسطر الطلب لا يحتوي على لون محفوظ.')
    const key = `${modelId}\u0000${color}`
    const current = changes.get(key)
    if (current) current.delta += delta
    else changes.set(key, { modelId, color, delta })
  }
  for (const item of items) add(item.modelId, item.color, direction * item.quantity)
  for (const exchange of exchanges) {
    add(exchange.newModelId, exchange.newColor, direction * exchange.newQty)
    add(exchange.returnedModelId, exchange.returnedColor, -direction * exchange.returnedQty)
  }
  for (const change of changes.values()) {
    if (change.delta === 0) continue
    const updated = await tx.update(modelColors)
      .set({ stock: sql`${modelColors.stock} + ${change.delta}` })
      .where(and(
        eq(modelColors.modelId, change.modelId),
        eq(modelColors.color, change.color),
        sql`${modelColors.stock} >= ${Math.max(0, -change.delta)}`,
      ))
      .returning({ id: modelColors.id })
    if (updated.length !== 1) {
      throw new UserError(change.delta < 0
        ? 'المخزون غير كافٍ لإعادة تفعيل الطلب. راجعي الكميات المتوفرة أولاً.'
        : 'تعذر العثور على لون مرتبط بالطلب لإرجاعه إلى المخزون.')
    }
  }
}

export async function createOrder(input: OrderInput) {
  return run(async () => {
    const customerName = text(input.customerName)
    const phone = text(input.phone, 30)
    const city = text(input.city, 80)
    const area = text(input.area, 100)
    const region = text(input.region, 20)
    if (!customerName) throw new UserError('اسم العميلة مطلوب')
    if (!/^[0-9+\-\s]{7,20}$/.test(phone)) throw new UserError('رقم الهاتف غير صالح')
    if (!city) throw new UserError('المدينة مطلوبة')
    const expectedRegion = CITY_REGIONS[city]
    if (expectedRegion && expectedRegion !== region) throw new UserError('منطقة التوصيل لا تتوافق مع المدينة المحددة')
    if (!area) throw new UserError('المنطقة/الحي مطلوب')
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
    const discount = amount(input.discount ?? 0)
    let createdOrderId: number | null = null
    let shouldAutoDispatch = false

    await db.transaction(async (tx) => {
      const modelIds = [
        ...new Set([
          ...items.map((i) => i.modelId),
          ...exchanges.flatMap((e) => [e.returnedModelId, e.newModelId]),
        ]),
      ]
      const [modelRows, colorRows, courierRows] = await Promise.all([
        tx.select().from(models).where(inArray(models.id, modelIds)),
        tx.select().from(modelColors).where(inArray(modelColors.modelId, modelIds)).for('update'),
        courierId ? tx.select().from(couriers).where(eq(couriers.id, courierId)) : Promise.resolve([]),
      ])
      if (courierId && courierRows.length === 0) throw new UserError('شركة التوصيل غير موجودة')
      shouldAutoDispatch = Boolean(courierRows[0]?.active && courierRows[0]?.apiEnabled && courierRows[0]?.sendOnOrderCreate)

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
        const returnedColor = getColor(ex.returnedModelId, ex.returnedColor, true)!
        need(returnedColor.id, -ex.returnedQty)
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
      const discountableSubtotal = itemsTotal + Math.max(0, exchangeDiff)
      const orderSubtotal = Math.max(itemsTotal + shippingFee + exchangeDiff, 0)
      if (discount > discountableSubtotal) throw new UserError('الخصم لا يمكن أن يتجاوز قيمة المنتجات، ولا يشمل رسوم التوصيل')
      const [order] = await tx
        .insert(orders)
        .values({
          customerName,
          phone,
          region,
          city,
          area,
          address: text(input.address, 300) || null,
          courierId,
          trackingNumber: text(input.trackingNumber, 80) || null,
          notes: text(input.notes, 500) || null,
          itemsTotal,
          shippingFee,
          discount,
          exchangeDiff,
          total: Math.max(orderSubtotal - discount, 0),
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

    // Automatic dispatch is opt-in per courier; selecting a courier alone must never create a shipment.
    if (createdOrderId && courierId && shouldAutoDispatch) {
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
      const [current] = await tx.select().from(orders).where(eq(orders.id, oid)).for('update')
      if (!current) throw new UserError('الطلب غير موجود')
      const wasInactive = INACTIVE_STATUSES.includes(current.status as StatusKey)
      const isInactive = INACTIVE_STATUSES.includes(status)
      if (wasInactive && status !== current.status) {
        throw new UserError('لا يمكن تغيير حالة طلب ملغي أو مرتجع. أنشئي طلباً جديداً بعد مراجعة المخزون.')
      }
      if (current.status === 'shipped' && !['shipped', 'delivered', 'returned'].includes(status)) {
        throw new UserError('الطلب خرج للتوصيل؛ لا يمكن إعادته إلى التجهيز أو إلغاؤه. إذا عاد الطرد فعلياً، اختاري حالة "راجع".')
      }
      if (current.status === 'delivered' && !['delivered', 'returned'].includes(status)) {
        throw new UserError('الطلب تم تسليمه؛ لا يمكن إلغاءه أو إعادته إلى التجهيز. عند استلام المرتجع اختاري حالة "راجع".')
      }
      if (current.status === 'preparing' && status === 'returned') {
        throw new UserError('الطلب لم يغادر المستودع بعد؛ اختاري حالة "ملغي" إذا لم يعد مطلوباً.')
      }
      if (!wasInactive && isInactive) await adjustOrderStock(tx, oid, 1)

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
        total: Math.max(current.itemsTotal + shippingFee + current.exchangeDiff - current.discount, 0),
        courierFee: courierFeeFor(courier, region),
      })
      .where(eq(orders.id, oid))
    if (courierId && courier && courier.active && courier.apiEnabled && courier.sendOnOrderCreate && (courierId !== current.courierId || !['sent', 'synced'].includes(current.syncStatus))) {
      const { dispatchShipment } = await import('@/lib/shipping/dispatch')
      await dispatchShipment(oid)
    }
  })
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
  })
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
  })
}

export async function deleteOrder(orderId: number) {
  return run(async () => {
    const oid = id(orderId)
    await db.transaction(async (tx) => {
      const [current] = await tx.select().from(orders).where(eq(orders.id, oid)).for('update')
      if (!current) return
      if (current.status !== 'preparing' && !INACTIVE_STATUSES.includes(current.status as StatusKey)) {
        throw new UserError('لا يمكن حذف طلب خرج للتوصيل أو تم تسليمه. إذا عاد الطرد فعلياً، غيّري حالته إلى "راجع" للحفاظ على سجل الطلب والمخزون.')
      }
      if (current.status === 'preparing') await adjustOrderStock(tx, oid, 1)
      await tx.delete(orderItems).where(eq(orderItems.orderId, oid))
      await tx.delete(orderExchanges).where(eq(orderExchanges.orderId, oid))
      await tx.delete(orders).where(eq(orders.id, oid))
    })
  })
}
