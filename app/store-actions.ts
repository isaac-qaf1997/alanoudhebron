'use server'

import { eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { modelColors, models, orderItems, orders } from '@/lib/db/schema'
import { REGIONS, isRegion } from '@/lib/constants'

export type StoreOrderResult = { ok: true; orderId: number } | { ok: false; error: string }

const clean = (v: unknown, max: number) => typeof v === 'string' ? v.trim().slice(0, max) : ''

export async function submitStoreOrder(input: {
  customerName: string
  phone: string
  city: string
  area: string
  region: string
  address: string
  paymentMethod: 'cod' | 'prepaid'
  paymentReference?: string
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
      return { ok: false, error: 'يرجى تعبئة الاسم والهاتف والمدينة والعنوان واختيار منطقة التوصيل بشكل صحيح.' }
    }
    if (paymentMethod !== 'cod' && paymentMethod !== 'prepaid') return { ok: false, error: 'طريقة الدفع غير صحيحة.' }
    const items = (input.items ?? []).map((item) => ({
      modelId: Number(item.modelId), color: clean(item.color, 60), quantity: Number(item.quantity),
    }))
    if (!items.length || items.length > 30 || items.some((i) => !Number.isInteger(i.modelId) || i.modelId <= 0 || !i.color || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 20)) {
      return { ok: false, error: 'السلة تحتوي على بيانات غير صحيحة.' }
    }
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    if (totalQuantity > 50) return { ok: false, error: 'الحد الأقصى للطلب 50 قطعة.' }

    const orderId = await db.transaction(async (tx) => {
      const modelIds = [...new Set(items.map((item) => item.modelId))]
      const [modelRows, colorRows] = await Promise.all([
        tx.select().from(models).where(inArray(models.id, modelIds)),
        tx.select().from(modelColors).where(inArray(modelColors.modelId, modelIds)).for('update'),
      ])
      let itemsTotal = 0
      let costTotal = 0
      const orderLines = items.map((item) => {
        const model = modelRows.find((row) => row.id === item.modelId)
        const color = colorRows.find((row) => row.modelId === item.modelId && row.color === item.color)
        if (!model || !color) throw new Error('أحد المنتجات أو الألوان لم يعد متاحاً.')
        if (color.stock < item.quantity) throw new Error(`المخزون غير كافٍ للون ${item.color} من ${model.name}. المتوفر: ${color.stock}`)
        itemsTotal += model.price * item.quantity
        costTotal += model.cost * item.quantity
        return { modelId: model.id, modelName: model.name, color: item.color, quantity: item.quantity, unitPrice: model.price, unitCost: model.cost, colorId: color.id }
      })
      for (const line of orderLines) {
        const changed = await tx.update(modelColors)
          .set({ stock: sql`${modelColors.stock} - ${line.quantity}` })
          .where(sql`${modelColors.id} = ${line.colorId} and ${modelColors.stock} >= ${line.quantity}`)
          .returning({ id: modelColors.id })
        if (!changed.length) throw new Error('نفدت كمية أحد المنتجات أثناء إتمام الطلب. حدّثي السلة وحاولي مجدداً.')
      }
      const shippingFee = REGIONS[region as keyof typeof REGIONS].fee
      const total = itemsTotal + shippingFee
      const [order] = await tx.insert(orders).values({
        customerName, phone, region, city, area, address, itemsTotal, shippingFee, total, costTotal,
        paymentMethod, amountPaid: 0,
        paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'pending_review',
        paymentReference: clean(input.paymentReference, 120) || null,
        notes: 'طلب من المتجر الإلكتروني',
      }).returning({ id: orders.id })
      await tx.insert(orderItems).values(orderLines.map(({ colorId, ...line }) => ({ ...line, orderId: order.id })))
      return order.id
    })
    return { ok: true, orderId }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    return { ok: false, error: message || 'تعذر إتمام الطلب حالياً. حاولي مرة أخرى.' }
  }
}
