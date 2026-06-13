"use client";

import { useEffect, useState } from "react";
import TradeCard from "@/components/TradeCard";
import { Loader2, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface Trade {
  id: string;
  symbol: string;
  company_name: string;
  trade_type: "BUY" | "SELL";
  quantity: number;
  price_at_trade: number;
  total_value: number;
  pnl: number | null;
  ai_debrief: string | null;
  traded_at: string;
}

export default function HistoryPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await fetch("/api/history");
        if (!res.ok) throw new Error("Failed to load trade history");
        const data = await res.json();
        setTrades(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, []);

  // Calculate summary stats
  const totalTrades = trades.length;
  const totalBuys = trades.filter((t) => t.trade_type === "BUY").length;
  const totalSells = trades.filter((t) => t.trade_type === "SELL").length;
  const realizedPnl = trades
    .filter((t) => t.pnl !== null)
    .reduce((sum, t) => sum + (t.pnl ?? 0), 0);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Trade History
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete log of all your transactions
        </p>
      </div>

      {/* Summary Stats */}
      {!loading && trades.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-up-delay-1">
          <div className="glass-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Trades
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {totalTrades}
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Buys
            </p>
            <p className="text-2xl font-bold text-profit mt-1">{totalBuys}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Sells
            </p>
            <p className="text-2xl font-bold text-loss mt-1">{totalSells}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Realized P&L
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${realizedPnl >= 0 ? "text-profit" : "text-loss"}`}
            >
              {realizedPnl >= 0 ? "+" : ""}$
              {Math.abs(realizedPnl).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="glass-card p-16 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="glass-card p-6 text-center">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      ) : trades.length === 0 ? (
        <div className="glass-card p-16 text-center animate-fade-up">
          <div className="h-14 w-14 rounded-2xl bg-accent/50 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            No trades yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Once you buy or sell stocks, your trades will appear here with a
            complete transaction log.
          </p>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-up-delay-2">
          {trades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} />
          ))}
        </div>
      )}
    </div>
  );
}
