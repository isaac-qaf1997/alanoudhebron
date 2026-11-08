> **ملاحظة تحديث (نوفمبر 2026):** هذا الملف يصف أساس التكامل العام القديم، وليس دليل التشغيل الحالي. المسار الفعلي للـ webhook هو `/api/shipping/webhooks/[providerKey]`، والتنفيذ الحالي موجود في `lib/shipping/dispatch.ts` و`lib/shipping/opost.ts`. راجعي `SHIPPING_INTEGRATIONS.md` و`OPOST_SETUP.md` قبل أي إعداد فعلي. لا تفعّلي إرسال الشحنات الحقيقية قبل اختبار بيئة المزود والحصول على موافقة صريحة.

# Shipping API Integration Setup

This project now contains a provider-neutral shipping adapter for the Next.js App Router.
It is **not yet tied to a specific delivery company**. Each carrier has its own API paths,
authorization headers, request fields, response format, and webhook signature rules. The
adapter below provides a documented normalized contract; `lib/shipping/provider.ts` and
`app/api/webhooks/shipping/route.ts` must be adjusted to the carrier's official API docs
before live use.

## 1. Database migration (Neon)

Run `db/migrations/0002_shipping_integration.sql` once against the existing Neon database
already used by this Vercel project. Do not create a second database and do not delete any
existing tables or records. The migration only adds integration columns and an event table.

## 2. Vercel environment variables

Add these variables for **Production**, and also Preview if you test preview deployments:

- `SHIPPING_CREDENTIALS_ENCRYPTION_KEY`: base64-encoded 32-byte key. Generate locally with:

  ```bash
  openssl rand -base64 32
  ```

- `SHIPPING_SETTINGS_PASSWORD`: a long, unique password used to authorize changes to API
  credentials in the shipping settings form. It must not be the carrier's API key.

Redeploy after adding or changing environment variables. Do not put the API Key or Secret
Token in client-side `NEXT_PUBLIC_` variables.

The API Key and Secret Token entered in `/shipping` are encrypted using AES-256-GCM before
being stored in Neon. The encrypted values are never selected by the page query or sent to
the browser. The encryption key must remain unchanged; changing it makes previously saved
credentials unreadable, so save a secure backup of it.

## 3. Configure a carrier in the dashboard

1. Open `/shipping` and add the carrier as usual if it is not already listed.
2. Expand **إعدادات API** on that carrier card.
3. Enter the carrier's Base URL, API Key, Secret Token, and the `SHIPPING_SETTINGS_PASSWORD`.
4. Enable API integration and save. The credential fields are write-only; leave them blank to
   keep the already saved values.
5. Optionally enable “send immediately when an order is created”. If disabled, the parcel is
   created when the order is changed to **قيد التوصيل** / `shipped` from the dashboard.

## 4. Current normalized outgoing API contract

The current adapter sends `POST {BASE_URL}/shipments` with:

Headers:

- `Authorization: Bearer {API_KEY}`
- `X-Secret-Token: {SECRET_TOKEN}`
- `Idempotency-Key: alanoud-order-{orderId}`
- `Content-Type: application/json`

JSON body:

```json
{
  "merchant_reference": "123",
  "recipient": {
    "name": "Customer Name",
    "phone": "0590000000",
    "city": "Nablus",
    "address": "Street and building",
    "region": "west_bank"
  },
  "cod_amount": 250,
  "currency": "ILS",
  "notes": "Optional order notes"
}
```

A successful JSON response must contain a tracking identifier in one of:
`tracking_number`, `trackingNumber`, or `tracking` (also accepted under `data` or `shipment`).
The response may also include `shipment_id`, `shipmentId`, or `id`.

This is a generic contract, **not a claim that every carrier supports these exact names**.
Adapt the endpoint, headers, body, and response parser in `lib/shipping/provider.ts` to the
chosen company's official documentation before enabling the integration.

## 5. Incoming webhook

Configure the carrier's webhook destination as:

`https://YOUR-PRODUCTION-DOMAIN/api/webhooks/shipping`

The current generic route accepts either:

- `X-Shipping-Token: {SECRET_TOKEN}`, or
- `Authorization: Bearer {SECRET_TOKEN}`

Example JSON body:

```json
{
  "event_id": "evt_123456",
  "tracking_number": "TRK-123456",
  "status": "delivered"
}
```

It also recognizes `trackingNumber`, `tracking_code`, `waybill_number`, `awb`,
`shipment_id`, `shipmentId`, `shipment_status`, `delivery_status`, and `event`. Statuses
are mapped to the app's `preparing`, `shipped`, `delivered`, `returned`, and `cancelled`
states. Extend the mapping in `app/api/webhooks/shipping/route.ts` for the carrier's exact
status vocabulary. Duplicate event IDs are ignored. The shared Secret Token is used for
webhook authentication in this generic implementation; if the carrier requires HMAC
signatures, implement its official signature verification instead.

## 6. Security and operational notes

- This app's existing dashboard does not currently have user sign-in. `SHIPPING_SETTINGS_PASSWORD`
  protects writes to the integration credentials form, but it does not replace full dashboard
  authentication. Do not treat this as a multi-user secured admin panel.
- Only send customer information to a carrier you have authorized to process it.
- A successful carrier API response is saved as the order's tracking number and external shipment ID.
- If the provider call fails, the order remains available in the dashboard and the error is saved
  in `orders.shipping_error`; retry only after checking whether the carrier created the parcel.
- The `Idempotency-Key` header is included to reduce duplicate parcels, but the carrier must
  explicitly support idempotency for that protection to be effective.
- The webhook adjusts local order state and applies the app's existing stock restoration logic
  when a parcel becomes returned/cancelled.
