-- Shipping provider integration. Run once on the existing Neon database.
-- This migration only adds nullable/configuration columns and a webhook event table.

ALTER TABLE public.couriers
  ADD COLUMN IF NOT EXISTS api_base_url text,
  ADD COLUMN IF NOT EXISTS api_key_encrypted text,
  ADD COLUMN IF NOT EXISTS secret_token_encrypted text,
  ADD COLUMN IF NOT EXISTS api_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS send_on_order_create boolean NOT NULL DEFAULT false;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS external_shipment_id text,
  ADD COLUMN IF NOT EXISTS shipping_provider_status text,
  ADD COLUMN IF NOT EXISTS shipping_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS shipping_error text;

CREATE TABLE IF NOT EXISTS public.shipping_webhook_events (
  id serial PRIMARY KEY,
  event_id text NOT NULL,
  courier_id integer NOT NULL,
  tracking_number text NOT NULL,
  provider_status text NOT NULL,
  payload jsonb,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS shipping_webhook_events_event_id_uq
  ON public.shipping_webhook_events (event_id);

CREATE INDEX IF NOT EXISTS orders_tracking_number_idx
  ON public.orders (tracking_number);
