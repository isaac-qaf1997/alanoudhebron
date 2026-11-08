-- Optional additional model and per-color gallery images. Existing primary image URLs remain untouched.
ALTER TABLE models ADD COLUMN IF NOT EXISTS gallery_urls jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE model_colors ADD COLUMN IF NOT EXISTS gallery_urls jsonb NOT NULL DEFAULT '[]'::jsonb;
