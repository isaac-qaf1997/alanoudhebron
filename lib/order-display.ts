import type { OrderFull } from '@/lib/queries'

export type OrderDisplay = Pick<
  OrderFull,
  | 'id'
  | 'customerName'
  | 'phone'
  | 'region'
  | 'city'
  | 'address'
  | 'trackingNumber'
  | 'status'
  | 'shippingFee'
  | 'notes'
  | 'shippedAt'
  | 'deliveredAt'
  | 'createdAt'
  | 'total'
  | 'shippingError'
  | 'courierName'
> & {
  items: Pick<OrderFull['items'][number], 'id' | 'modelName' | 'color' | 'quantity' | 'unitPrice'>[]
  exchanges: Pick<
    OrderFull['exchanges'][number],
    'id' | 'returnedName' | 'returnedColor' | 'returnedQty' | 'newName' | 'newColor' | 'newQty' | 'diff'
  >[]
}

export function toOrderDisplay(order: OrderFull): OrderDisplay {
  return {
    id: order.id,
    customerName: order.customerName,
    phone: order.phone,
    region: order.region,
    city: order.city,
    address: order.address,
    trackingNumber: order.trackingNumber,
    status: order.status,
    shippingFee: order.shippingFee,
    notes: order.notes,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    createdAt: order.createdAt,
    total: order.total,
    shippingError: order.shippingError,
    courierName: order.courierName,
    items: order.items.map((item) => ({
      id: item.id,
      modelName: item.modelName,
      color: item.color,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    exchanges: order.exchanges.map((exchange) => ({
      id: exchange.id,
      returnedName: exchange.returnedName,
      returnedColor: exchange.returnedColor,
      returnedQty: exchange.returnedQty,
      newName: exchange.newName,
      newColor: exchange.newColor,
      newQty: exchange.newQty,
      diff: exchange.diff,
    })),
  }
}
