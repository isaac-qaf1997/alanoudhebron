-- Optional inventory and per-color size variants. Existing stock values and historical order lines are preserved.
ALTER TABLE model_colors ALTER COLUMN stock DROP NOT NULL;

CREATE TABLE IF NOT EXISTS model_sizes (
  id serial PRIMARY KEY,
  model_color_id integer NOT NULL REFERENCES model_colors(id) ON DELETE CASCADE,
  size text NOT NULL,
  stock integer,
  CONSTRAINT model_sizes_size_nonempty CHECK (length(btrim(size)) > 0),
  CONSTRAINT model_sizes_stock_nonnegative CHECK (stock IS NULL OR stock >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS model_sizes_color_size_normalized_uq
  ON model_sizes (model_color_id, lower(btrim(size)));

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size text;
ALTER TABLE order_exchanges ADD COLUMN IF NOT EXISTS returned_size text;
ALTER TABLE order_exchanges ADD COLUMN IF NOT EXISTS new_size text;
