import type { OrderFull } from '@/lib/queries'

export type OrderDisplay = Pick<
  OrderFull,
  | 'id' | 'customerName' | 'phone' | 'region' | 'city' | 'address'
  | 'trackingNumber' | 'status' | 'shippingFee' | 'discount' | 'couponCode' | 'notes'
  | 'shippedAt' | 'deliveredAt' | 'createdAt' | 'total'
  | 'syncError' | 'courierName'
> & {
  items: Pick<OrderFull['items'][number], 'id' | 'modelName' | 'color' | 'quantity' | 'unitPrice'>[]
  exchanges: Pick<OrderFull['exchanges'][number], 'id' | 'returnedName' | 'returnedColor' | 'returnedQty' | 'newName' | 'newColor' | 'newQty' | 'diff'>[]
}

export function toOrderDisplay(order: OrderFull): OrderDisplay {
  return {
    id: order.id, customerName: order.customerName, phone: order.phone,
    region: order.region, city: order.city, address: order.address,
    trackingNumber: order.trackingNumber, status: order.status,
    shippingFee: order.shippingFee, discount: order.discount, couponCode: order.couponCode, notes: order.notes,
    shippedAt: order.shippedAt, deliveredAt: order.deliveredAt,
    createdAt: order.createdAt, total: order.total,
    syncError: order.syncError, courierName: order.courierName,
    items: order.items.map(({ id, modelName, color, quantity, unitPrice }) => ({ id, modelName, color, quantity, unitPrice })),
    exchanges: order.exchanges.map(({ id, returnedName, returnedColor, returnedQty, newName, newColor, newQty, diff }) => ({ id, returnedName, returnedColor, returnedQty, newName, newColor, newQty, diff })),
  }
}
