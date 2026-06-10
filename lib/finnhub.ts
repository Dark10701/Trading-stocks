const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

if (!FINNHUB_API_KEY) {
  throw new Error('FINNHUB_API_KEY is missing in environment variables');
}

export async function getCompanyNews(symbol: string, from: string, to: string) {
  const url = `${BASE_URL}/company-news?symbol=${symbol.toUpperCase()}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
  const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache news for an hour
  if (!response.ok) throw new Error(`Failed to fetch news for ${symbol}`);
  
  const data = await response.json();
  return data || [];
}
