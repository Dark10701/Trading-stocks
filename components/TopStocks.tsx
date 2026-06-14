"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

interface TopStock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface TopStocksProps {
  onSelect: (symbol: string) => void;
}

export default function TopStocks({ onSelect }: TopStocksProps) {
  const [stocks, setStocks] = useState<TopStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/stocks/top")
      .then((r) => r.json())
      .then((d) => setStocks(Array.isArray(d) ? d : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || stocks.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Couldn&apos;t load popular stocks right now. Try searching above.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Popular Stocks
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {stocks.map((s) => {
          const isUp = s.change >= 0;
          return (
            <button
              key={s.ticker}
              onClick={() => onSelect(s.ticker)}
              className="glass-card p-4 text-left hover:bg-[oklch(0.2_0.02_260_/_60%)] transition-all duration-200 group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                  {s.ticker}
                </span>
                <span
                  className={`flex items-center gap-0.5 text-xs font-semibold ${
                    isUp ? "text-profit" : "text-loss"
                  }`}
                >
                  {isUp ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {isUp ? "+" : ""}
                  {s.changePercent.toFixed(2)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {s.name}
              </p>
              <p className="text-lg font-bold text-foreground mt-2">
                ${s.price.toFixed(2)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
