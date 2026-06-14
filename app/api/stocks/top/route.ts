import { NextResponse } from "next/server";
import { getRecentTradingDayBars } from "@/lib/polygon";

// Names for well-known tickers so famous movers show a company name.
// Movers outside this list still display (ticker + price + change).
const KNOWN_NAMES: Record<string, string> = {
  AAPL: "Apple",
  MSFT: "Microsoft",
  NVDA: "NVIDIA",
  GOOGL: "Alphabet (Google)",
  GOOG: "Alphabet (Google)",
  AMZN: "Amazon",
  META: "Meta Platforms",
  TSLA: "Tesla",
  AMD: "Advanced Micro Devices",
  NFLX: "Netflix",
  JPM: "JPMorgan Chase",
  V: "Visa",
  MA: "Mastercard",
  WMT: "Walmart",
  DIS: "Walt Disney",
  KO: "Coca-Cola",
  PEP: "PepsiCo",
  COST: "Costco",
  INTC: "Intel",
  BAC: "Bank of America",
  XOM: "Exxon Mobil",
  CVX: "Chevron",
  PFE: "Pfizer",
  MRNA: "Moderna",
  BA: "Boeing",
  F: "Ford",
  GM: "General Motors",
  UBER: "Uber",
  ABNB: "Airbnb",
  SHOP: "Shopify",
  PYPL: "PayPal",
  SQ: "Block (Square)",
  COIN: "Coinbase",
  PLTR: "Palantir",
  SOFI: "SoFi",
  RIVN: "Rivian",
  LCID: "Lucid",
  SNAP: "Snap",
  PINS: "Pinterest",
  ORCL: "Oracle",
  CRM: "Salesforce",
  ADBE: "Adobe",
  QCOM: "Qualcomm",
  MU: "Micron",
  T: "AT&T",
  VZ: "Verizon",
  NKE: "Nike",
  SBUX: "Starbucks",
  MCD: "McDonald's",
  GE: "GE Aerospace",
  C: "Citigroup",
};

// Liquidity filters so we surface real, tradable companies (not penny pumps).
const MIN_PRICE = 5; // dollars
const MAX_PRICE = 5000;
const MIN_DOLLAR_VOLUME = 30_000_000; // $30M traded that day
const LIMIT = 16;
const VALID_TICKER = /^[A-Z]{1,5}$/;

export async function GET(request: Request) {
  try {
    const direction =
      new URL(request.url).searchParams.get("direction") === "losers"
        ? "losers"
        : "gainers";

    const bars = await getRecentTradingDayBars();

    const movers = bars
      .filter(
        (b: any) =>
          b.T &&
          VALID_TICKER.test(b.T) &&
          b.o > 0 &&
          b.c >= MIN_PRICE &&
          b.c <= MAX_PRICE &&
          b.c * b.v >= MIN_DOLLAR_VOLUME
      )
      .map((b: any) => {
        const change = b.c - b.o;
        return {
          ticker: b.T,
          name: KNOWN_NAMES[b.T] ?? null,
          price: b.c,
          change,
          changePercent: (change / b.o) * 100,
        };
      });

    movers.sort((a: any, b: any) =>
      direction === "gainers"
        ? b.changePercent - a.changePercent
        : a.changePercent - b.changePercent
    );

    return NextResponse.json(movers.slice(0, LIMIT));
  } catch (error: any) {
    console.error("Top movers API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch top movers" },
      { status: 500 }
    );
  }
}
