import { STATUS_KEYS, type StatusKey } from '@/lib/constants'
import type { CourierPublic } from '@/lib/db/schema'
import type { OrderFull } from '@/lib/queries'

export function computeStats(orders: OrderFull[], couriers: Courier[]) {
  const statusCounts = Object.fromEntries(STATUS_KEYS.map((s) => [s, 0])) as Record<StatusKey, number>
  const cityCounts = new Map<string, number>()

  let parcelsOut = 0
  let sales = 0
  let netProfit = 0
  let collected = 0
  let collectedFees = 0

  const courierStats = new Map(
    couriers.map((c) => [
      c.id,
      { id: c.id, name: c.name, inTransit: 0, delivered: 0, returned: 0, collected: 0, fees: 0 },
    ]),
  )

  for (const order of orders) {
    const status = order.status as StatusKey
    statusCounts[status] = (statusCounts[status] ?? 0) + 1
    if (order.shippedAt) parcelsOut += 1
    if (status !== 'cancelled' && status !== 'returned') sales += order.total
    if (status !== 'cancelled') cityCounts.set(order.city, (cityCounts.get(order.city) ?? 0) + 1)

    if (status === 'delivered') {
      netProfit += order.total - order.costTotal - order.courierFee
      collected += order.total
      collectedFees += order.courierFee
    } else if (status === 'returned') {
      netProfit -= order.courierFee
    }

    const courier = order.courierId ? courierStats.get(order.courierId) : undefined
    if (courier) {
      if (status === 'shipped') courier.inTransit += 1
      if (status === 'delivered') {
        courier.delivered += 1
        courier.collected += order.total
        courier.fees += order.courierFee
      }
      if (status === 'returned') {
        courier.returned += 1
        courier.fees += order.courierFee
      }
    }
  }

  return {
    totalOrders: orders.length,
    parcelsOut,
    sales,
    netProfit,
    collected,
    collectedFees,
    collectedNet: collected - collectedFees,
    statusCounts,
    cities: [...cityCounts.entries()].sort((a, b) => b[1] - a[1]),
    couriers: [...courierStats.values()],
  }
}

export type DashboardStats = ReturnType<typeof computeStats>
