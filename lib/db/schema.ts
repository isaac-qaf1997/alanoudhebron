import { boolean, integer, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

const money = (name: string) => numeric(name, { precision: 10, scale: 2, mode: 'number' })

export const models = pgTable('models', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku'),
  price: money('price').notNull().default(0),
  cost: money('cost').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const modelColors = pgTable('model_colors', {
  id: serial('id').primaryKey(),
  modelId: integer('model_id').notNull(),
  color: text('color').notNull(),
  stock: integer('stock').notNull().default(0),
})

export const couriers = pgTable('couriers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  feeWestBank: money('fee_west_bank').notNull().default(15),
  feeJerusalem: money('fee_jerusalem').notNull().default(25),
  feeInside: money('fee_inside').notNull().default(60),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  region: text('region').notNull(),
  city: text('city').notNull(),
  address: text('address'),
  courierId: integer('courier_id'),
  trackingNumber: text('tracking_number'),
  status: text('status').notNull().default('preparing'),
  itemsTotal: money('items_total').notNull().default(0),
  shippingFee: money('shipping_fee').notNull().default(0),
  exchangeDiff: money('exchange_diff').notNull().default(0),
  total: money('total').notNull().default(0),
  costTotal: money('cost_total').notNull().default(0),
  courierFee: money('courier_fee').notNull().default(0),
  notes: text('notes'),
  shippedAt: timestamp('shipped_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull(),
  modelId: integer('model_id'),
  modelName: text('model_name').notNull(),
  color: text('color'),
  quantity: integer('quantity').notNull(),
  unitPrice: money('unit_price').notNull(),
  unitCost: money('unit_cost').notNull().default(0),
})

export const orderExchanges = pgTable('order_exchanges', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull(),
  returnedModelId: integer('returned_model_id'),
  returnedName: text('returned_name').notNull(),
  returnedColor: text('returned_color'),
  returnedQty: integer('returned_qty').notNull(),
  returnedPrice: money('returned_price').notNull(),
  returnedCost: money('returned_cost').notNull().default(0),
  newModelId: integer('new_model_id'),
  newName: text('new_name').notNull(),
  newColor: text('new_color'),
  newQty: integer('new_qty').notNull(),
  newPrice: money('new_price').notNull(),
  newCost: money('new_cost').notNull().default(0),
  diff: money('diff').notNull(),
})

export type Model = typeof models.$inferSelect
export type ModelColor = typeof modelColors.$inferSelect
export type Courier = typeof couriers.$inferSelect
export type Order = typeof orders.$inferSelect
export type OrderItem = typeof orderItems.$inferSelect
export type OrderExchange = typeof orderExchanges.$inferSelect
