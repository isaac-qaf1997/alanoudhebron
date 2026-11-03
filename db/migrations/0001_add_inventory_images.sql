-- Run once against the PostgreSQL database already used by this application.
ALTER TABLE models
  ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE model_colors
  ADD COLUMN IF NOT EXISTS image_url text;
