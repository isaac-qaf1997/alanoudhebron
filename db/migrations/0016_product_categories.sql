-- Product categories for storefront navigation and filtering.
ALTER TABLE models ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'تشكيلات أخرى';
CREATE INDEX IF NOT EXISTS models_category_published_created_idx ON models (category, is_published, created_at DESC);
