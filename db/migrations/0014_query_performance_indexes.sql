-- Supporting indexes for the most common storefront, order history, and delivery queries.
-- CREATE INDEX IF NOT EXISTS is safe to re-run and does not alter existing order or inventory data.
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at);
CREATE INDEX IF NOT EXISTS orders_shipped_at_idx ON orders (shipped_at);
CREATE INDEX IF NOT EXISTS orders_courier_shipped_at_idx ON orders (courier_id, shipped_at);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);
CREATE INDEX IF NOT EXISTS order_exchanges_order_id_idx ON order_exchanges (order_id);
