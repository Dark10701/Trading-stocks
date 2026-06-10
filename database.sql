-- Portfolio: single row for the user's cash balance
CREATE TABLE portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_balance NUMERIC(12, 2) NOT NULL DEFAULT 10000.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert the single user's portfolio
INSERT INTO portfolio (cash_balance) VALUES (10000.00);

-- Positions: currently held stocks (one row per stock)
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL UNIQUE,
  company_name VARCHAR(255),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  avg_buy_price NUMERIC(12, 2) NOT NULL,
  bought_at TIMESTAMPTZ DEFAULT now()
);

-- Trades: immutable log of every buy/sell
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  company_name VARCHAR(255),
  trade_type VARCHAR(4) NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_trade NUMERIC(12, 2) NOT NULL,
  total_value NUMERIC(12, 2) NOT NULL,
  pnl NUMERIC(12, 2),                  -- NULL for BUY, calculated on SELL
  ai_debrief TEXT,                       -- NULL until AI generates it post-sell
  traded_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_traded_at ON trades(traded_at DESC);
