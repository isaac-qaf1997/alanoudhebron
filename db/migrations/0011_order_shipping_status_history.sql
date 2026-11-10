-- Opost/carrier status timeline. Apply only to the isolated test branch first.
-- Existing order provider-status columns are already present in this database;
-- this migration adds the dedicated timeline table only.
CREATE TABLE IF NOT EXISTS public.order_shipping_status_history (
  id serial PRIMARY KEY,
  order_id integer NOT NULL,
  provider_key text NOT NULL,
  provider_status text NOT NULL,
  provider_label text,
  order_status text,
  source text NOT NULL DEFAULT 'poll',
  external_event_id text,
  occurred_at timestamptz,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_shipping_status_history_order_time_idx
  ON public.order_shipping_status_history (order_id, recorded_at);

CREATE INDEX IF NOT EXISTS order_shipping_status_history_provider_status_idx
  ON public.order_shipping_status_history (provider_key, provider_status);

CREATE UNIQUE INDEX IF NOT EXISTS order_shipping_status_history_external_event_uq
  ON public.order_shipping_status_history (provider_key, external_event_id)
  WHERE external_event_id IS NOT NULL;
