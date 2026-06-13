-- Migration v2: portfolio value snapshots (powers the dashboard value-over-time chart)
-- Run this in the Supabase SQL editor after the initial schema + RLS fix.

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_value NUMERIC(12, 2) NOT NULL,   -- cash + market value of all positions at snapshot time
  cash_balance NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON portfolio_snapshots(created_at);

-- Single-user app: permissive RLS so the anon key can read/write.
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all" ON portfolio_snapshots;
CREATE POLICY "allow all" ON portfolio_snapshots FOR ALL USING (true) WITH CHECK (true);

-- Seed an initial data point so the chart has a starting value.
INSERT INTO portfolio_snapshots (total_value, cash_balance)
SELECT cash_balance, cash_balance FROM portfolio
WHERE NOT EXISTS (SELECT 1 FROM portfolio_snapshots);
