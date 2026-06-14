const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const BASE_URL = 'https://api.polygon.io';

if (!POLYGON_API_KEY) {
  throw new Error('POLYGON_API_KEY is missing in environment variables');
}

export async function getQuote(symbol: string) {
  const url = `${BASE_URL}/v2/aggs/ticker/${symbol.toUpperCase()}/prev?apiKey=${POLYGON_API_KEY}`;
  const response = await fetch(url, { next: { revalidate: 60 } }); // Basic cache to save API limits
  if (!response.ok) throw new Error(`Failed to fetch quote for ${symbol}`);
  
  const data = await response.json();
  if (!data.results || data.results.length === 0) return null;
  return data.results[0]; // Returns { c, h, l, o, v, vw, t } where c is close price
}

export async function getPriceHistory(symbol: string, from: string, to: string) {
  const url = `${BASE_URL}/v2/aggs/ticker/${symbol.toUpperCase()}/range/1/day/${from}/${to}?apiKey=${POLYGON_API_KEY}`;
  const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache historical data longer
  if (!response.ok) throw new Error(`Failed to fetch history for ${symbol}`);
  
  const data = await response.json();
  return data.results || [];
}

// All US stocks' OHLC for a single day in ONE request (free-tier friendly).
export async function getGroupedDaily(date: string) {
  const url = `${BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/${date}?adjusted=true&apiKey=${POLYGON_API_KEY}`;
  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error('Failed to fetch grouped daily bars');

  const data = await response.json();
  return data.results || []; // each: { T, o, h, l, c, v, ... }
}

// Grouped bars for the most recent completed trading day (skips weekends/holidays).
export async function getRecentTradingDayBars() {
  const today = new Date();
  for (let i = 1; i <= 6; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue; // skip Sat/Sun
    const ds = day.toISOString().split('T')[0];
    try {
      const bars = await getGroupedDaily(ds);
      if (bars.length > 0) return bars;
    } catch {
      // try an earlier day
    }
  }
  return [];
}

export async function searchTickers(query: string) {
  const url = `${BASE_URL}/v3/reference/tickers?search=${encodeURIComponent(query)}&apiKey=${POLYGON_API_KEY}`;
  const response = await fetch(url, { next: { revalidate: 300 } });
  if (!response.ok) throw new Error('Failed to search tickers');
  
  const data = await response.json();
  return data.results || [];
}
