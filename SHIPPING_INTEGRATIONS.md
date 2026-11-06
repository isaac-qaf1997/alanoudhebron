# Multi-courier integration foundation

The shipping module supports multiple courier records. Each courier can optionally have an `integrationKey` (for example `carrier_a`). Secrets are never stored in PostgreSQL or exposed to the browser; configure them as server environment variables:

- `COURIER_CARRIER_A_API_URL`
- `COURIER_CARRIER_A_API_TOKEN`
- `COURIER_CARRIER_A_CREATE_PATH` (optional; defaults to `/shipments`)
- `COURIER_CARRIER_A_WEBHOOK_SECRET`

When a courier is assigned to a new order, or selected orders are marked as shipped, the server sends a normalized JSON payload to the configured carrier endpoint. The endpoint is expected to accept a bearer token and return JSON containing `id` or `shipmentId`, and/or `trackingNumber`. Inactive couriers are not sent shipments.

Webhook URL: `https://YOUR_DOMAIN/api/shipping/webhooks/carrier_a`. Send the configured secret in `x-webhook-secret`.

Normalized webhook JSON fields: `status`, and at least one of `trackingNumber`, `shipmentId`, or `reference` (`ORDER-123`). `eventId` is recommended; if omitted, the payload hash is used for de-duplication. Supported statuses include `preparing`, `in_transit`/`shipped`, `delivered`, and `returned` (plus common English and Arabic aliases).

## Database upgrade

Apply `db/migrations/0004_multi_courier_integrations.sql` to the existing PostgreSQL database before deploying. It upgrades the earlier single-carrier webhook table if migration 0002 was already applied, preserving the old table as `shipping_webhook_events_legacy`.

## Provider-specific limitation

This is a generic adapter contract, not a prebuilt integration with every courier. Each carrier has its own authentication, request/response fields, signature scheme, and status vocabulary. Before enabling a real carrier, implement its adapter against its official API documentation. Do not put API secrets in the courier form or client-side code.

The generic outbound adapter sends a JSON body to `POST /shipments` (or the configured create path), uses `Authorization: Bearer <token>` and a stable `Idempotency-Key: order-123` header, and expects an identifier in the response. A carrier must honor that idempotency header to prevent duplicates after ambiguous network timeouts. Concurrent sends are claimed atomically in the database.

Webhook example:

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

The webhook accepts `x-webhook-secret`, limits request bodies to 64 KB, and de-duplicates events. If the carrier omits an event ID, the raw payload hash is used as a fallback. Status changes are transactional; transitions into or out of returned/cancelled state adjust stock.

To add another courier, create it with a unique integration key, add its matching `COURIER_<KEY>_API_URL`, `API_TOKEN`, optional `CREATE_PATH`, and `WEBHOOK_SECRET` environment variables, then map its API/webhook format in a provider-specific adapter. Test create-shipment, idempotency, delivered, and returned events in the carrier sandbox before live use.
