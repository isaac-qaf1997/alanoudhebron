-- User accounts and role-based access for the Alanoud inventory application.
-- Safe to run once on the existing Neon database. Does not modify orders or stock.
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'staff'))
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_uq
  ON public.users (lower(username));
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users (role);
