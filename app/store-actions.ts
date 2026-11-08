'use server'

import { eq, inArray, sql } from 'drizzle-orm'
import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { coupons, modelColors, modelSizes, models, orderItems, orders } from '@/lib/db/schema'
import { CITY_REGIONS, REGIONS, isRegion } from '@/lib/constants'

export type StoreOrderResult = { ok: true; orderId: number } | { ok: false; error: string }

const clean = (v: unknown, max: number) => typeof v === 'string' ? v.trim().slice(0, max) : ''

function couponDiscount(coupon: typeof coupons.$inferSelect, subtotal: number) {
  const raw = coupon.discountType === 'percentage'
    ? subtotal * coupon.discountValue / 100
    : coupon.discountValue
  return Math.min(subtotal, Math.round(raw * 100) / 100)
}

function couponAvailability(coupon: typeof coupons.$inferSelect | undefined) {
  if (!coupon || !coupon.active) return 'كود الخصم غير صحيح أو غير مفعّل.'
  const now = Date.now()
  if (coupon.startsAt && coupon.startsAt.getTime() > now) return 'هذا الكود لم يبدأ استخدامه بعد.'
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= now) return 'انتهت صلاحية كود الخصم.'
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return 'تم استخدام هذا الكود للعدد المسموح.'
  return null
}

export async function checkStoreCoupon(codeInput: string, subtotalInput: number) {
  try {
    const code = clean(codeInput, 32).toUpperCase()
    const subtotal = Number(subtotalInput)
    if (!/^[A-Z0-9_-]{3,32}$/.test(code) || !Number.isFinite(subtotal) || subtotal <= 0) {
      return { ok: false as const, error: 'أدخلي كود خصم صحيحاً.' }
    }
    const [coupon] = await db.select().from(coupons).where(sql`upper(${coupons.code}) = ${code}`).limit(1)
    const unavailable = couponAvailability(coupon)
    if (unavailable) return { ok: false as const, error: unavailable }
    return { ok: true as const, code, discount: couponDiscount(coupon!, subtotal), discountType: coupon!.discountType, discountValue: coupon!.discountValue }
  } catch {
    return { ok: false as const, error: 'تعذر التحقق من الكود حالياً. حاولي مرة أخرى.' }
  }
}

export async function submitStoreOrder(input: {
  customerName: string
  phone: string
  city: string
  area: string
  region: string
  address: string
  paymentMethod: 'cod' | 'prepaid'
  paymentReference?: string
  checkoutRequestKey: string
  couponCode?: string
  items: { modelId: number; color: string; quantity: number }[]
}): Promise<StoreOrderResult> {
  try {
    const customerName = clean(input.customerName, 120)
    const phone = clean(input.phone, 30)
    const city = clean(input.city, 80)
    const area = clean(input.area, 100)
    const address = clean(input.address, 300)
    const region = clean(input.region, 20)
    const paymentMethod = input.paymentMethod
    if (!customerName || !/^[0-9+\-\s]{7,20}$/.test(phone) || !city || !area || !address || !isRegion(region)) {
      return { ok: false, error: 'يرجى تعبئة الاسم والهاتف والمدينة والمنطقة/الحي والعنوان واختيار منطقة التوصيل بشكل صحيح.' }
    }
    const expectedRegion = CITY_REGIONS[city]
    if (expectedRegion && expectedRegion !== region) {
      return { ok: false, error: 'منطقة التوصيل لا تتوافق مع المدينة المحددة. راجعي المدينة ومنطقة التوصيل.' }
    }
    if (paymentMethod !== 'cod' && paymentMethod !== 'prepaid') return { ok: false, error: 'طريقة الدفع غير صالحة.' }
    const checkoutRequestKey = clean(input.checkoutRequestKey, 36)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(checkoutRequestKey)) {
      return { ok: false, error: 'تعذر التحقق من الطلب. حدّثي الصفحة وحاولي مرة أخرى.' }
    }
    // A retry with the same key returns the original order without touching stock or rate limits.
    const [existingOrder] = await db.select({ id: orders.id }).from(orders).where(eq(orders.checkoutRequestKey, checkoutRequestKey)).limit(1)
    if (existingOrder) return { ok: true, orderId: existingOrder.id }

    // Throttle both the originating IP (when supplied by the hosting proxy) and phone number.
    const requestHeaders = await headers()
    const forwarded = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
    const realIp = requestHeaders.get('x-real-ip')?.trim()
    const ip = forwarded || realIp
    const buckets = [
      ...(ip ? [`ip:${createHash('sha256').update(ip).digest('hex')}`] : []),
      `phone:${createHash('sha256').update(phone.replace(/\D/g, '')).digest('hex')}`,
    ]
    for (const bucket of buckets) {
      const limitResult = await db.execute<{ request_count: number }>(sql`
        INSERT INTO store_order_rate_limits (bucket_key, window_started_at, request_count)
        VALUES (${bucket}, now(), 1)
        ON CONFLICT (bucket_key) DO UPDATE SET
          request_count = CASE
            WHEN store_order_rate_limits.window_started_at < now() - interval '1 hour' THEN 1
            ELSE store_order_rate_limits.request_count + 1
          END,
          window_started_at = CASE
            WHEN store_order_rate_limits.window_started_at < now() - interval '1 hour' THEN now()
            ELSE store_order_rate_limits.window_started_at
          END
        RETURNING request_count
      `)
      if (Number(limitResult.rows[0]?.request_count ?? 0) > 5) {
        return { ok: false, error: 'وصلتنا عدة محاولات طلب خلال وقت قصير. حاولي بعد ساعة أو تواصلي معنا للمساعدة.' }
      }
    }
    const items = (input.items ?? []).map((item) => ({
      modelId: Number(item.modelId), color: clean(item.color, 60), size: clean(item.size, 40) || null, quantity: Number(item.quantity),
    }))
    if (!items.length || items.length > 30 || items.some((i) => !Number.isInteger(i.modelId) || i.modelId <= 0 || !i.color || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 20)) {
      return { ok: false, error: 'السلة تحتوي على بيانات غير صحيحة.' }
    }
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    if (totalQuantity > 50) return { ok: false, error: 'الحد الأقصى للطلب 50 قطعة.' }

    const orderId = await db.transaction(async (tx) => {
      const modelIds = [...new Set(items.map((item) => item.modelId))]
      // A transaction is backed by one PostgreSQL client; sequential reads avoid
      // concurrent client.query() calls and their queueing/deprecation warning.
      const modelRows = await tx.select().from(models).where(inArray(models.id, modelIds))
      const colorRows = await tx.select().from(modelColors).where(inArray(modelColors.modelId, modelIds)).for('update')
      const sizeRows = await tx.select().from(modelSizes).where(inArray(modelSizes.modelColorId, colorRows.map(v => v.id))).for('update')
      let itemsTotal = 0
      let costTotal = 0
      const orderLines = items.map((item) => {
        const model = modelRows.find((row) => row.id === item.modelId)
        const color = colorRows.find((row) => row.modelId === item.modelId && row.color === item.color)
        if (!model || !color) throw new Error('أحد المنتجات أو الألوان لم يعد متاحاً.')
        const sizes = sizeRows.filter(s => s.modelColorId === color.id)
        if (sizes.length && !item.size) throw new Error(`اختاري المقاس للون ${item.color} من ${model.name}.`)
        if (!sizes.length && item.size) throw new Error('المقاس المحدد غير متاح لهذا اللون.')
        const size = item.size ? sizes.find(s => s.size === item.size) : null
        if (item.size && !size) throw new Error('المقاس المحدد لم يعد متاحاً.')
        const stock = size ? size.stock : color.stock
        if (stock !== null && stock < item.quantity) throw new Error(`المخزون غير كافٍ لـ${model.name} — ${item.color}${item.size ? ' / ' + item.size : ''}. المتوفر: ${stock}`)
        itemsTotal += model.price * item.quantity
        costTotal += model.cost * item.quantity
        return { modelId: model.id, modelName: model.name, color: item.color, size: item.size, quantity: item.quantity, unitPrice: model.price, unitCost: model.cost, colorId: color.id, sizeId: size?.id ?? null, stockTracked: stock !== null }
      })
      const stockNeeds = new Map<string, { id: number; size: boolean; quantity: number }>()
      for (const line of orderLines) {
        if (!line.stockTracked) continue
        const key = line.sizeId ? 's:' + line.sizeId : 'c:' + line.colorId
        const old = stockNeeds.get(key)
        stockNeeds.set(key, { id: line.sizeId ?? line.colorId, size: Boolean(line.sizeId), quantity: (old?.quantity ?? 0) + line.quantity })
      }
      for (const need of stockNeeds.values()) {
        const changed = need.size
          ? await tx.update(modelSizes).set({ stock: sql`${modelSizes.stock} - ${need.quantity}` }).where(sql`${modelSizes.id} = ${need.id} AND ${modelSizes.stock} >= ${need.quantity}`).returning({ id: modelSizes.id })
          : await tx.update(modelColors).set({ stock: sql`${modelColors.stock} - ${need.quantity}` }).where(sql`${modelColors.id} = ${need.id} AND ${modelColors.stock} >= ${need.quantity}`).returning({ id: modelColors.id })
        if (!changed.length) throw new Error('نفدت كمية أحد المنتجات أثناء إتمام الطلب. حدّثي السلة وحاولي مجدداً.')
      }
      const couponCode = clean(input.couponCode, 32).toUpperCase()
      let discount = 0
      if (couponCode) {
        const [coupon] = await tx.select().from(coupons).where(sql`upper(${coupons.code}) = ${couponCode}`).for('update')
        const unavailable = couponAvailability(coupon)
        if (unavailable) throw new Error(unavailable)
        discount = couponDiscount(coupon!, itemsTotal)
        await tx.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, coupon!.id))
      }
      const shippingFee = REGIONS[region as keyof typeof REGIONS].fee
      const total = itemsTotal + shippingFee - discount
      const [order] = await tx.insert(orders).values({
        customerName, phone, region, city, area, address, itemsTotal, shippingFee, discount, couponCode: couponCode || null, total, costTotal,
        paymentMethod, amountPaid: 0,
        paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'pending_review',
        paymentReference: paymentMethod === 'prepaid' ? clean(input.paymentReference, 160) || null : null,
        checkoutRequestKey,
        notes: 'طلب من المتجر الإلكتروني',
      }).returning({ id: orders.id })
      await tx.insert(orderItems).values(orderLines.map(({ colorId, sizeId, stockTracked, ...line }) => ({ ...line, orderId: order.id })))
      return order.id
    })
    return { ok: true, orderId }
  } catch (error) {
    // If two identical submissions race, the unique index lets only one create an order.
    const key = clean(input.checkoutRequestKey, 36)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
      const [existingOrder] = await db.select({ id: orders.id }).from(orders).where(eq(orders.checkoutRequestKey, key)).limit(1)
      if (existingOrder) return { ok: true, orderId: existingOrder.id }
    }
    const message = error instanceof Error ? error.message : ''
    return { ok: false, error: message || 'تعذر إتمام الطلب حالياً. حاولي مرة أخرى.' }
  }
}
