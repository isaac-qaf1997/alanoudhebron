import { boolean, integer, jsonb, numeric, pgTable, serial, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

const money = (name: string) => numeric(name, { precision: 10, scale: 2, mode: 'number' })

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    username: text('username').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').$type<'admin' | 'staff'>().notNull().default('staff'),
    active: boolean('active').notNull().default(true),
    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  },
  (table) => ({ usernameUnique: uniqueIndex('users_username_lower_uq').on(sql`lower(${table.username})`), roleIndex: index('users_role_idx').on(table.role) }),
)

export type UserRole = 'admin' | 'staff'
export type AppUser = typeof users.$inferSelect


export const models = pgTable('models', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku'),
  price: money('price').notNull().default(0),
  cost: money('cost').notNull().default(0),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const modelColors = pgTable('model_colors', {
  id: serial('id').primaryKey(),
  modelId: integer('model_id').notNull(),
  color: text('color').notNull(),
  stock: integer('stock').notNull().default(0),
  imageUrl: text('image_url'),
}, (table) => ({
  modelColorUnique: uniqueIndex('model_colors_model_color_normalized_uq').on(table.modelId, sql`lower(btrim(${table.color}))`),
}))

export const couriers = pgTable('couriers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  feeWestBank: money('fee_west_bank').notNull().default(18),
  feeJerusalem: money('fee_jerusalem').notNull().default(28),
  feeArea67: money('fee_area_67').notNull().default(50),
  feeInside: money('fee_inside').notNull().default(68),
  active: boolean('active').notNull().default(true),
  integrationKey: text('integration_key'),
  apiBaseUrl: text('api_base_url'),
  apiKeyEncrypted: text('api_key_encrypted'),
  secretTokenEncrypted: text('secret_token_encrypted'),
  apiEnabled: boolean('api_enabled').notNull().default(false),
  sendOnOrderCreate: boolean('send_on_order_create').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  integrationKeyUnique: uniqueIndex('couriers_integration_key_uq').on(table.integrationKey).where(sql`${table.integrationKey} IS NOT NULL AND btrim(${table.integrationKey}) <> ''`),
}))

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  region: text('region').notNull(),
  city: text('city').notNull(),
  address: text('address'),
  area: text('area'),
  courierId: integer('courier_id'),
  trackingNumber: text('tracking_number'),
  status: text('status').notNull().default('preparing'),
  itemsTotal: money('items_total').notNull().default(0),
  shippingFee: money('shipping_fee').notNull().default(0),
  discount: money('discount').notNull().default(0),
  couponCode: text('coupon_code'),
  exchangeDiff: money('exchange_diff').notNull().default(0),
  total: money('total').notNull().default(0),
  costTotal: money('cost_total').notNull().default(0),
  courierFee: money('courier_fee').notNull().default(0),
  notes: text('notes'),
  paymentMethod: text('payment_method').$type<'cod' | 'prepaid'>().notNull().default('cod'),
  amountPaid: money('amount_paid').notNull().default(0),
  paymentStatus: text('payment_status').$type<'unpaid' | 'pending_review' | 'paid' | 'partially_paid'>().notNull().default('unpaid'),
  paymentReference: text('payment_reference'),
  checkoutRequestKey: text('checkout_request_key'),
  shippedAt: timestamp('shipped_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  externalShipmentId: text('external_shipment_id'),
  syncStatus: text('sync_status').notNull().default('not_configured'),
  syncError: text('sync_error'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ checkoutRequestUnique: uniqueIndex('orders_checkout_request_key_uq').on(table.checkoutRequestKey).where(sql`${table.checkoutRequestKey} IS NOT NULL`) }))

export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountType: text('discount_type').$type<'fixed' | 'percentage'>().notNull(),
  discountValue: money('discount_value').notNull(),
  active: boolean('active').notNull().default(true),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  usageLimit: integer('usage_limit'),
  usedCount: integer('used_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  codeUpperUnique: uniqueIndex('coupons_code_upper_uq').on(sql`upper(${table.code})`),
}))

export type Coupon = typeof coupons.$inferSelect

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

export const shippingWebhookEvents = pgTable(
  'shipping_webhook_events',
  {
    id: serial('id').primaryKey(),
    providerKey: text('provider_key').notNull(),
    eventId: text('event_id').notNull(),
    orderId: integer('order_id'),
    eventType: text('event_type').notNull(),
    payload: text('payload').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerEventUnique: uniqueIndex('shipping_webhook_events_provider_event_unique').on(table.providerKey, table.eventId),
    orderIndex: index('shipping_webhook_events_order_idx').on(table.orderId),
  }),
)

export type Model = typeof models.$inferSelect
export type ModelColor = typeof modelColors.$inferSelect
export type Courier = typeof couriers.$inferSelect
export type CourierPublic = Pick<
  Courier,
  | 'id'
  | 'name'
  | 'phone'
  | 'feeWestBank'
  | 'feeJerusalem'
  | 'feeArea67'
  | 'feeInside'
  | 'active'
  | 'integrationKey'
  | 'createdAt'
  | 'apiBaseUrl'
  | 'apiEnabled'
  | 'sendOnOrderCreate'
> & { hasApiKey: boolean; hasSecretToken: boolean }
export type Order = typeof orders.$inferSelect
export type OrderItem = typeof orderItems.$inferSelect
export type OrderExchange = typeof orderExchanges.$inferSelect


export const storeOrderRateLimits = pgTable(
  'store_order_rate_limits',
  {
    bucketKey: text('bucket_key').primaryKey(),
    windowStartedAt: timestamp('window_started_at', { withTimezone: true }).notNull().defaultNow(),
    requestCount: integer('request_count').notNull().default(1),
  },
)
