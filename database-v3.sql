-- Migration v3: multi-user authentication.
-- Adds per-user ownership to every table and replaces the permissive "allow all"
-- policies with row-level security scoped to the signed-in user (auth.uid()).
--
-- NOTE: this wipes the existing single shared portfolio (it was test data with no
-- owner). Each user gets a fresh $10,000 portfolio on first sign-in.

-- 1. Clear old un-owned data.
DELETE FROM portfolio_snapshots;
DELETE FROM trades;
DELETE FROM positions;
DELETE FROM portfolio;

-- 2. Add user ownership (cascades on user deletion).
ALTER TABLE portfolio            ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE positions            ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE trades               ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE portfolio_snapshots  ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. One portfolio per user; one position per (user, symbol).
ALTER TABLE portfolio  DROP CONSTRAINT IF EXISTS portfolio_user_id_key;
ALTER TABLE portfolio  ADD  CONSTRAINT portfolio_user_id_key UNIQUE (user_id);

ALTER TABLE positions  DROP CONSTRAINT IF EXISTS positions_symbol_key;        -- old global unique
ALTER TABLE positions  DROP CONSTRAINT IF EXISTS positions_user_symbol_key;
ALTER TABLE positions  ADD  CONSTRAINT positions_user_symbol_key UNIQUE (user_id, symbol);

-- 4. Helpful indexes for per-user lookups.
CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user    ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user ON portfolio_snapshots(user_id);

-- 5. Replace permissive policies with per-user RLS.
DROP POLICY IF EXISTS "allow all" ON portfolio;
DROP POLICY IF EXISTS "allow all" ON positions;
DROP POLICY IF EXISTS "allow all" ON trades;
DROP POLICY IF EXISTS "allow all" ON portfolio_snapshots;

CREATE POLICY "own portfolio"  ON portfolio           FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own positions"  ON positions           FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own trades"     ON trades              FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own snapshots"  ON portfolio_snapshots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
