"use client";

import { useState } from "react";
import Link from "next/link";
import StockSearch from "@/components/StockSearch";
import StockChart from "@/components/StockChart";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";

export default function ExplorePage() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const [quote, setQuote] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchStockData = async (symbol: string) => {
    setSelectedSymbol(symbol);
    setLoadingData(true);
    setError(null);

    try {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(now.getDate() - 14);

      const formatDate = (d: Date) => d.toISOString().split("T")[0];

      const [quoteRes, histRes, newsRes] = await Promise.all([
        fetch(`/api/stocks/quote?symbol=${symbol}`),
        fetch(
          `/api/stocks/history?symbol=${symbol}&from=${formatDate(thirtyDaysAgo)}&to=${formatDate(now)}`
        ),
        fetch(
          `/api/stocks/news?symbol=${symbol}&from=${formatDate(fourteenDaysAgo)}&to=${formatDate(now)}`
        ),
      ]);

      if (!quoteRes.ok) throw new Error("Failed to fetch quote");

      const quoteData = await quoteRes.json();
      const histData = histRes.ok ? await histRes.json() : [];
      const newsData = newsRes.ok ? await newsRes.json() : [];

      setQuote(quoteData);
      setHistory(histData);
      setNews(newsData);
    } catch (err: any) {
      setError(err.message || "Failed to load stock data");
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-up">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Explore Stocks
        </h1>
        <p className="text-muted-foreground mt-1">
          Search by ticker symbol or company name
        </p>
      </div>

      {/* Search */}
      <div className="mb-12 animate-fade-up-delay-1">
        <StockSearch onSelect={fetchStockData} />
      </div>

      {loadingData && (
        <div className="flex justify-center my-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="glass-card p-5 text-center mb-8 animate-fade-up">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      )}

      {!loadingData && selectedSymbol && quote && !error && (
        <div className="space-y-8 animate-fade-up">
          {/* Price header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-4xl font-bold text-foreground tracking-tight">
                {selectedSymbol}
              </h2>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-semibold text-foreground">
                  ${quote.c?.toFixed(2)}
                </span>
              </div>
            </div>
            <Link href={`/trade/${selectedSymbol}`}>
              <Button className="w-full md:w-auto gap-2 bg-gradient-to-r from-[oklch(0.65_0.18_270)] to-[oklch(0.55_0.2_280)] hover:opacity-90 transition-opacity text-white border-0 font-bold px-8 shadow-lg shadow-[oklch(0.65_0.18_270_/_20%)]">
                Trade {selectedSymbol}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Chart */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              30-Day Price History
            </h3>
            <StockChart data={history} />
          </div>

          {/* News */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Recent News
            </h3>
            {news && news.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {news.slice(0, 6).map((item: any, i: number) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="glass-card p-5 h-full hover:bg-[oklch(0.2_0.02_260_/_60%)] transition-all duration-200 cursor-pointer group">
                      <h4 className="font-semibold text-foreground line-clamp-2 leading-snug text-sm group-hover:text-primary transition-colors">
                        {item.headline}
                      </h4>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          {item.source}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(
                            item.datetime * 1000
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 text-center">
                <p className="text-muted-foreground text-sm italic">
                  No recent news found for this company.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
