ALTER TABLE public.couriers
  ADD COLUMN IF NOT EXISTS fee_area_67 numeric(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount numeric(10, 2) NOT NULL DEFAULT 0;
