"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StockChart from "@/components/StockChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function TradePage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params.symbol as string)?.toUpperCase();

  const [quote, setQuote] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [position, setPosition] = useState<any>(null);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buy form
  const [quantity, setQuantity] = useState<string>("");
  const [buying, setBuying] = useState(false);
  const [selling, setSelling] = useState(false);
  const [tradeResult, setTradeResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const fmt = (d: Date) => d.toISOString().split("T")[0];

        const [quoteRes, histRes, portfolioRes] = await Promise.all([
          fetch(`/api/stocks/quote?symbol=${symbol}`),
          fetch(
            `/api/stocks/history?symbol=${symbol}&from=${fmt(thirtyDaysAgo)}&to=${fmt(now)}`
          ),
          fetch(`/api/portfolio`),
        ]);

        if (!quoteRes.ok) throw new Error("Could not load price data");

        const quoteData = await quoteRes.json();
        setQuote(quoteData);

        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(histData);
        }

        if (portfolioRes.ok) {
          const pData = await portfolioRes.json();
          setCashBalance(pData.cash_balance);
          const existing = pData.positions?.find(
            (p: any) => p.symbol === symbol
          );
          setPosition(existing || null);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [symbol]);

  const currentPrice = quote?.c ?? 0;
  const qty = parseInt(quantity) || 0;
  const totalCost = qty * currentPrice;
  const canAfford = totalCost <= cashBalance && totalCost > 0;

  const handleBuy = async () => {
    if (!canAfford || buying) return;
    setBuying(true);
    setTradeResult(null);

    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          companyName: symbol,
          quantity: qty,
          tradeType: "BUY",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Buy failed");

      setTradeResult({
        type: "success",
        message: `Bought ${qty} shares of ${symbol} at $${currentPrice.toFixed(2)} for $${totalCost.toFixed(2)}`,
      });
      setCashBalance(data.newBalance);
      setQuantity("");
      // Re-fetch to show updated position
      const pRes = await fetch("/api/portfolio");
      if (pRes.ok) {
        const pData = await pRes.json();
        const existing = pData.positions?.find(
          (p: any) => p.symbol === symbol
        );
        setPosition(existing || null);
      }
    } catch (err: any) {
      setTradeResult({ type: "error", message: err.message });
    } finally {
      setBuying(false);
    }
  };

  const handleSell = async () => {
    if (!position || selling) return;
    setSelling(true);
    setTradeResult(null);

    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, tradeType: "SELL" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sell failed");

      const pnlSign = data.pnl >= 0 ? "+" : "";
      setTradeResult({
        type: "success",
        message: `Sold all shares of ${symbol}. P&L: ${pnlSign}$${Math.abs(data.pnl).toFixed(2)}`,
      });
      setCashBalance(data.newBalance);
      setPosition(null);
    } catch (err: any) {
      setTradeResult({ type: "error", message: err.message });
    } finally {
      setSelling(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      {/* Back link */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Explore
      </Link>

      {error && (
        <div className="glass-card p-6 text-center mb-8">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      )}

      {quote && (
        <div className="space-y-8 animate-fade-up">
          {/* Header: Symbol + Price */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">
                {symbol}
              </h1>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-semibold text-foreground">
                  ${currentPrice.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Cash available:{" "}
              <span className="font-bold text-foreground">
                $
                {cashBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Chart */}
          <div className="glass-card p-6 animate-fade-up-delay-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              30-Day Price History
            </h3>
            <StockChart data={history} />
          </div>

          {/* Trade Result */}
          {tradeResult && (
            <div
              className={`glass-card p-5 flex items-start gap-3 animate-fade-up ${
                tradeResult.type === "success"
                  ? "border-l-4 border-l-[oklch(0.72_0.19_165)]"
                  : "border-l-4 border-l-destructive"
              }`}
            >
              {tradeResult.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-profit shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-foreground text-sm">
                  {tradeResult.type === "success"
                    ? "Trade Executed"
                    : "Trade Failed"}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {tradeResult.message}
                </p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 animate-fade-up-delay-2">
            {/* Buy Card */}
            {!position && (
              <div className="glass-card gradient-border p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-8 w-8 rounded-lg bg-profit flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-profit" />
                  </div>
                  <h3 className="font-bold text-foreground">
                    Buy {symbol}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Enter number of shares"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="bg-input/50"
                    />
                  </div>

                  {qty > 0 && (
                    <div className="space-y-2 py-3 border-t border-border/50">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Price per share
                        </span>
                        <span className="font-medium text-foreground">
                          ${currentPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Total cost
                        </span>
                        <span className="font-bold text-foreground">
                          ${totalCost.toFixed(2)}
                        </span>
                      </div>
                      {!canAfford && (
                        <p className="text-xs text-destructive font-medium">
                          Insufficient funds
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-[oklch(0.65_0.18_165)] to-[oklch(0.55_0.18_165)] hover:opacity-90 text-white border-0 font-bold"
                    onClick={handleBuy}
                    disabled={!canAfford || buying}
                  >
                    {buying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        Buy {qty > 0 ? `${qty} shares` : symbol}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Current Position / Sell Card */}
            {position && (
              <div className="glass-card gradient-border p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground">
                    Your Position
                  </h3>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shares held</span>
                    <span className="font-bold text-foreground">
                      {position.quantity}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg buy price</span>
                    <span className="font-medium text-foreground">
                      ${position.avg_buy_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current price</span>
                    <span className="font-medium text-foreground">
                      ${currentPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">
                      Unrealized P&L
                    </span>
                    <span
                      className={`font-bold ${position.unrealized_pnl >= 0 ? "text-profit" : "text-loss"}`}
                    >
                      {position.unrealized_pnl >= 0 ? "+" : ""}$
                      {Math.abs(position.unrealized_pnl).toFixed(2)}
                      <span className="text-xs ml-1">
                        ({position.unrealized_pnl >= 0 ? "+" : ""}
                        {position.pnl_percent.toFixed(2)}%)
                      </span>
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full gap-2 bg-gradient-to-r from-destructive to-[oklch(0.55_0.22_25)] hover:opacity-90 text-white border-0 font-bold"
                  onClick={handleSell}
                  disabled={selling}
                >
                  {selling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4" />
                      Sell All Shares
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Info Panel */}
            <div className="glass-card p-6">
              <h3 className="font-bold text-foreground mb-4">Quick Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Previous Close</span>
                  <span className="font-medium text-foreground">
                    ${quote.c?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Open</span>
                  <span className="font-medium text-foreground">
                    ${quote.o?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">High</span>
                  <span className="font-medium text-foreground">
                    ${quote.h?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Low</span>
                  <span className="font-medium text-foreground">
                    ${quote.l?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-medium text-foreground">
                    {quote.v?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
