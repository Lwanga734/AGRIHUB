-- ============================================================
--  AgriHub – Supabase (PostgreSQL) Schema
--  Run this once in the Supabase SQL Editor:
--    https://supabase.com/dashboard → your project → SQL Editor
-- ============================================================

-- ── Custom enum types ────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('farmer', 'trader', 'official', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE quality_grade AS ENUM ('A', 'B', 'C', 'ungraded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE produce_status AS ENUM ('pending', 'verified', 'sold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT          NOT NULL,
  email      TEXT          NOT NULL UNIQUE,
  password   TEXT          NOT NULL,
  role       user_role     NOT NULL DEFAULT 'farmer',
  phone      TEXT,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Produce ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produce (
  id              BIGSERIAL PRIMARY KEY,
  farmer_id       BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commodity       TEXT          NOT NULL,
  quantity_kg     NUMERIC(10,2) NOT NULL,
  source_location TEXT,
  quality_grade   quality_grade NOT NULL DEFAULT 'ungraded',
  status          produce_status NOT NULL DEFAULT 'pending',
  notes           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Prices ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prices (
  id         BIGSERIAL PRIMARY KEY,
  commodity  TEXT          NOT NULL,
  price_ugx  NUMERIC(10,2) NOT NULL,
  unit       TEXT          NOT NULL DEFAULT 'kg',
  logged_by  BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Transactions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id           BIGSERIAL PRIMARY KEY,
  produce_id   BIGINT         NOT NULL REFERENCES produce(id) ON DELETE CASCADE,
  buyer_id     BIGINT         NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  seller_id    BIGINT         NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  amount_ugx   NUMERIC(12,2)  NOT NULL,
  quantity_kg  NUMERIC(10,2)  NOT NULL,
  recorded_by  BIGINT         NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── Quality Checks ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quality_checks (
  id          BIGSERIAL PRIMARY KEY,
  produce_id  BIGINT        NOT NULL REFERENCES produce(id) ON DELETE CASCADE,
  official_id BIGINT        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  grade       quality_grade NOT NULL CHECK (grade IN ('A', 'B', 'C')),
  notes       TEXT,
  checked_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Notifications ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT          NOT NULL,
  title      TEXT          NOT NULL,
  message    TEXT          NOT NULL,
  is_read    BOOLEAN       NOT NULL DEFAULT FALSE,
  link       TEXT,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Row-Level Security ───────────────────────────────────────
-- The Node.js API uses the service-role key which bypasses RLS.
-- Enable RLS so the anon/public key cannot access tables directly.
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE produce         ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_produce_farmer_id       ON produce(farmer_id);
CREATE INDEX IF NOT EXISTS idx_produce_status          ON produce(status);
CREATE INDEX IF NOT EXISTS idx_prices_logged_by        ON prices(logged_by);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer      ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller     ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_produce    ON transactions(produce_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user      ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read   ON notifications(user_id, is_read);

-- ── updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
