-- Fix-up: allow the app (anon key) to access the tables.
-- This is a single-user paper trading app, so permissive policies are fine.
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all" ON portfolio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON trades FOR ALL USING (true) WITH CHECK (true);

-- Seed the starting balance (skipped if a row already exists)
INSERT INTO portfolio (cash_balance)
SELECT 10000.00
WHERE NOT EXISTS (SELECT 1 FROM portfolio);
