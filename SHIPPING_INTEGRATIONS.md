# Multi-courier integration foundation

The shipping module supports multiple courier records. Each courier can optionally have an `integrationKey` (for example `carrier_a`). Secrets are never stored in PostgreSQL or exposed to the browser; they are configured as server environment variables:

- `COURIER_CARRIER_A_API_URL`
- `COURIER_CARRIER_A_API_TOKEN`
- `COURIER_CARRIER_A_CREATE_PATH` (optional; defaults to `/shipments`)
- `COURIER_CARRIER_A_WEBHOOK_SECRET`

When a courier is assigned to a new order, or selected orders are marked as shipped, the server sends a normalized JSON payload to the configured carrier endpoint. The endpoint is expected to accept a bearer token and return JSON containing `id` or `shipmentId`, and/or `trackingNumber`. A response without either identifier is treated as a failed sync. Inactive couriers are not sent shipments.

Webhook URL: `https://YOUR_DOMAIN/api/shipping/webhooks/carrier_a`

Webhook authentication: send the configured secret in `x-webhook-secret`.

Normalized webhook JSON fields: `status`, and at least one of `trackingNumber`, `shipmentId`, or `reference` (`ORDER-123`). `eventId` is recommended; if omitted, the payload hash is used for de-duplication. Supported statuses include `preparing`, `in_transit`/`shipped`, `delivered`, and `returned` (plus common English and Arabic aliases).

## Important provider-specific step

This is a generic adapter contract, not a prebuilt integration with every courier. Each carrier has its own authentication, request fields, response fields, signature scheme, and status vocabulary. Before enabling a real carrier, implement or configure its adapter mapping against that carrier's official API documentation. Do not put API secrets in the courier form or client-side code.

Apply `db/migrations/0002_multi_courier_integrations.sql` to the existing PostgreSQL database before deploying this version.


## Outbound shipment payload

The generic adapter sends this shape to `POST /shipments` (or the configured create path):

```json
{
  "reference": "ORDER-123",
  "recipient": { "name": "Customer Name", "phone": "0590000000", "city": "Nablus", "region": "west_bank", "address": "Street / building" },
  "codAmount": 250,
  "notes": "Delivery notes",
  "items": [{ "name": "Abaya", "color": "Black", "quantity": 1 }]
}
```

The generic adapter uses `Authorization: Bearer <token>` and an `Idempotency-Key: order-123` header. A successful response must contain `id` or `shipmentId`, and/or `trackingNumber`.

## Normalized webhook example

```json
{
  "eventId": "carrier-event-unique-id",
  "event": "shipment.status.changed",
  "reference": "ORDER-123",
  "shipmentId": "external-shipment-456",
  "trackingNumber": "TRACK-456",
  "status": "in_transit"
}
```

The webhook accepts `x-webhook-secret`, limits request bodies to 64 KB, and de-duplicates events. If the carrier does not send an event ID, the raw payload hash is used as a fallback. Status updates are applied in a database transaction; transitions into or out of returned state also adjust stock using the same inventory rules as manual status changes.

## Adding another courier

1. Add a courier in Shipping Management and assign a unique integration key, such as `fast_ship`.
2. Add the matching `COURIER_FAST_SHIP_API_URL`, `COURIER_FAST_SHIP_API_TOKEN`, optional `COURIER_FAST_SHIP_CREATE_PATH`, and `COURIER_FAST_SHIP_WEBHOOK_SECRET` environment variables in the hosting provider.
3. Configure the courier's webhook URL as `https://YOUR_DOMAIN/api/shipping/webhooks/fast_ship` and map its events to the normalized payload above.
4. Test create-shipment, duplicate-send/idempotency, delivered, and returned events in the courier's sandbox before enabling live shipments.

**Adapter boundary:** the current outbound adapter intentionally implements a common bearer-token JSON contract. A carrier whose API uses a different authentication method, payload shape, response shape, or webhook signature needs a provider-specific adapter in `lib/shipping/` and a corresponding webhook verifier/normalizer. Adding a courier record alone does not make an arbitrary carrier API compatible.
