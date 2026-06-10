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

export async function searchTickers(query: string) {
  const url = `${BASE_URL}/v3/reference/tickers?search=${encodeURIComponent(query)}&apiKey=${POLYGON_API_KEY}`;
  const response = await fetch(url, { next: { revalidate: 300 } });
  if (!response.ok) throw new Error('Failed to search tickers');
  
  const data = await response.json();
  return data.results || [];
}
