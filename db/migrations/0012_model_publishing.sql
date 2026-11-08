ALTER TABLE models
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

-- Preserve the visibility of products that were already in the live catalog.
UPDATE models SET is_published = true WHERE is_published = false;
