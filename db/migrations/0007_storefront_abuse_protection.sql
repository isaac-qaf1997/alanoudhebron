-- Idempotency for public checkout and database-backed request throttling.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS checkout_request_key text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_checkout_request_key_uq
  ON public.orders (checkout_request_key)
  WHERE checkout_request_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.store_order_rate_limits (
  bucket_key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1
);
