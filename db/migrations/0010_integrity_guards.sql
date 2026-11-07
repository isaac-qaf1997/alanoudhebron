-- Integrity guards for inventory colors and courier provider keys.
-- Fail loudly rather than silently deleting or rewriting any existing records.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.model_colors
    GROUP BY model_id, lower(btrim(color))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate normalized model colors exist; resolve them before applying migration 0010.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.couriers
    WHERE integration_key IS NOT NULL AND btrim(integration_key) <> ''
    GROUP BY lower(btrim(integration_key))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate courier integration keys exist; resolve them before applying migration 0010.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS model_colors_model_color_normalized_uq
  ON public.model_colors (model_id, lower(btrim(color)));

CREATE UNIQUE INDEX IF NOT EXISTS couriers_integration_key_uq
  ON public.couriers (integration_key)
  WHERE integration_key IS NOT NULL AND btrim(integration_key) <> '';
