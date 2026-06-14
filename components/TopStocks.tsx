"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

interface TopStock {
  ticker: string;
  name: string | null;
  price: number;
  change: number;
  changePercent: number;
}

interface TopStocksProps {
  onSelect: (symbol: string) => void;
}

type Direction = "gainers" | "losers";

export default function TopStocks({ onSelect }: TopStocksProps) {
  const [direction, setDirection] = useState<Direction>("gainers");
  const [stocks, setStocks] = useState<TopStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`/api/stocks/top?direction=${direction}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setStocks(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [direction]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Top Movers
        </h3>
        {/* Gainers / Losers toggle */}
        <div className="inline-flex rounded-lg bg-accent/40 p-0.5">
          {(["gainers", "losers"] as Direction[]).map((d) => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                direction === d
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error || stocks.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Couldn&apos;t load movers right now. Try searching above.
          </p>
        </div>
      ) : (
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
                {s.name && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {s.name}
                  </p>
                )}
                <p className="text-lg font-bold text-foreground mt-2">
                  ${s.price.toFixed(2)}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
