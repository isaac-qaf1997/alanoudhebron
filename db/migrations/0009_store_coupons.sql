ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text;

CREATE TABLE IF NOT EXISTS public.coupons (
  id serial PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value numeric(10, 2) NOT NULL CHECK (discount_value > 0),
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit integer CHECK (usage_limit IS NULL OR usage_limit > 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (discount_type <> 'percentage' OR discount_value <= 100),
  CHECK (expires_at IS NULL OR starts_at IS NULL OR expires_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_upper_uq ON public.coupons (upper(code));
