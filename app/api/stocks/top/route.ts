import { NextResponse } from "next/server";
import { getRecentTradingDayBars } from "@/lib/polygon";

// Curated list of well-known US companies shown on the Explore page.
const TOP_COMPANIES: { ticker: string; name: string }[] = [
  { ticker: "AAPL", name: "Apple" },
  { ticker: "MSFT", name: "Microsoft" },
  { ticker: "NVDA", name: "NVIDIA" },
  { ticker: "GOOGL", name: "Alphabet (Google)" },
  { ticker: "AMZN", name: "Amazon" },
  { ticker: "META", name: "Meta Platforms" },
  { ticker: "TSLA", name: "Tesla" },
  { ticker: "AMD", name: "Advanced Micro Devices" },
  { ticker: "NFLX", name: "Netflix" },
  { ticker: "JPM", name: "JPMorgan Chase" },
  { ticker: "V", name: "Visa" },
  { ticker: "WMT", name: "Walmart" },
  { ticker: "DIS", name: "Walt Disney" },
  { ticker: "KO", name: "Coca-Cola" },
  { ticker: "COST", name: "Costco" },
  { ticker: "INTC", name: "Intel" },
];

export async function GET() {
  try {
    const bars = await getRecentTradingDayBars();
    const byTicker = new Map<string, any>(bars.map((b: any) => [b.T, b]));

    const stocks = TOP_COMPANIES.map(({ ticker, name }) => {
      const bar = byTicker.get(ticker);
      if (!bar || !bar.c) return null;
      const change = bar.c - bar.o;
      const changePercent = bar.o ? (change / bar.o) * 100 : 0;
      return {
        ticker,
        name,
        price: bar.c,
        change,
        changePercent,
      };
    }).filter(Boolean);

    return NextResponse.json(stocks);
  } catch (error: any) {
    console.error("Top stocks API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch top stocks" },
      { status: 500 }
    );
  }
}
