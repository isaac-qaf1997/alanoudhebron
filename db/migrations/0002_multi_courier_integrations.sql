-- Multi-carrier integration foundation. Apply once to the existing PostgreSQL database.
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS integration_key text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_shipment_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sync_status text NOT NULL DEFAULT 'not_configured';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sync_error text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

CREATE TABLE IF NOT EXISTS shipping_webhook_events (
  id serial PRIMARY KEY,
  provider_key text NOT NULL,
  event_id text NOT NULL,
  order_id integer,
  event_type text NOT NULL,
  payload text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shipping_webhook_events_provider_event_unique UNIQUE (provider_key, event_id)
);
CREATE INDEX IF NOT EXISTS shipping_webhook_events_order_idx ON shipping_webhook_events(order_id);
CREATE INDEX IF NOT EXISTS orders_external_shipment_idx ON orders(external_shipment_id);

CREATE INDEX IF NOT EXISTS couriers_integration_key_idx ON couriers(integration_key);
