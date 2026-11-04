import type { Courier, Order } from '@/lib/db/schema'
import { decryptShippingSecret } from '@/lib/shipping/credentials'

export type CarrierShipmentResult = {
  trackingNumber: string
  shipmentId: string | null
  providerStatus: string | null
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return null
}

export async function createCarrierShipment(courier: Courier, order: Order): Promise<CarrierShipmentResult> {
  const baseUrl = courier.apiBaseUrl?.trim()
  const apiKey = decryptShippingSecret(courier.apiKeyEncrypted)
  const secretToken = decryptShippingSecret(courier.secretTokenEncrypted)
  if (!baseUrl || !apiKey || !secretToken) {
    throw new Error('إعدادات API لشركة التوصيل غير مكتملة')
  }

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/shipments`
  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Secret-Token': secretToken,
        'Idempotency-Key': `alanoud-order-${order.id}`,
      },
      body: JSON.stringify({
        merchant_reference: String(order.id),
        recipient: {
          name: order.customerName,
          phone: order.phone,
          city: order.city,
          address: order.address ?? '',
          region: order.region,
        },
        cod_amount: Number(order.total),
        currency: 'ILS',
        notes: order.notes ?? '',
      }),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذر الاتصال بشركة التوصيل'
    throw new Error(`فشل الاتصال بواجهة شركة التوصيل: ${message}`)
  }

  const responseText = await response.text()
  let parsed: unknown = null
  try {
    parsed = responseText ? JSON.parse(responseText) : null
  } catch {
    parsed = { message: responseText.slice(0, 500) }
  }
  const root = record(parsed)
  const data = record(root?.data) ?? record(root?.shipment) ?? root

  if (!response.ok) {
    const message = firstString(data?.message, data?.error, root?.message, root?.error)
    throw new Error(`رفضت شركة التوصيل الطلب (${response.status})${message ? `: ${message}` : ''}`)
  }

  const trackingNumber = firstString(
    data?.tracking_number,
    data?.trackingNumber,
    data?.tracking,
    root?.tracking_number,
    root?.trackingNumber,
  )
  if (!trackingNumber) {
    throw new Error('تم الاتصال بالشركة لكن الاستجابة لا تحتوي رقم تتبع معروفاً. يلزم مطابقة تنسيق الاستجابة مع API الشركة.')
  }

  return {
    trackingNumber,
    shipmentId: firstString(data?.shipment_id, data?.shipmentId, data?.id, root?.shipment_id, root?.id),
    providerStatus: firstString(data?.status, root?.status),
  }
}
