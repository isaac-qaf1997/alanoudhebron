-- Upgrade the existing shipping integration schema to the multi-courier event model.
-- Safe whether the earlier 0002_shipping_integration migration was applied or not.
ALTER TABLE public.couriers ADD COLUMN IF NOT EXISTS integration_key text;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS external_shipment_id text,
  ADD COLUMN IF NOT EXISTS sync_status text NOT NULL DEFAULT 'not_configured',
  ADD COLUMN IF NOT EXISTS sync_error text,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;
-- Preserve the earlier single-carrier event table before creating the current shape.
DO $$
BEGIN
  IF to_regclass('public.shipping_webhook_events') IS NOT NULL
     AND to_regclass('public.shipping_webhook_events_legacy') IS NULL THEN
    ALTER TABLE public.shipping_webhook_events RENAME TO shipping_webhook_events_legacy;
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.shipping_webhook_events (
  id serial PRIMARY KEY,
  provider_key text NOT NULL,
  event_id text NOT NULL,
  order_id integer,
  event_type text NOT NULL,
  payload text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shipping_webhook_events_provider_event_unique UNIQUE (provider_key, event_id)
);
CREATE INDEX IF NOT EXISTS shipping_webhook_events_order_idx ON public.shipping_webhook_events(order_id);
CREATE INDEX IF NOT EXISTS orders_external_shipment_idx ON public.orders(external_shipment_id);
CREATE INDEX IF NOT EXISTS couriers_integration_key_idx ON public.couriers(integration_key);
