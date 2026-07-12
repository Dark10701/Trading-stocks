"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortfolioCard from "@/components/PortfolioCard";
import PortfolioChart from "@/components/PortfolioChart";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Search,
  Loader2,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from "lucide-react";

interface Position {
  id: string;
  symbol: string;
  company_name: string;
  quantity: number;
  avg_buy_price: number;
  current_price: number;
  market_value: number;
  cost_basis: number;
  unrealized_pnl: number;
  pnl_percent: number;
}

interface PortfolioData {
  cash_balance: number;
  total_market_value: number;
  total_portfolio_value: number;
  total_unrealized_pnl: number;
  positions: Position[];
}

interface Snapshot {
  total_value: number;
  cash_balance: number;
  created_at: string;
}

type PendingAction = { type: "reset" } | { type: "sell"; symbol: string };

export default function Dashboard() {
  const { toast } = useToast();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPortfolio = async () => {
    try {
      const [pRes, hRes] = await Promise.all([
        fetch("/api/portfolio"),
        fetch("/api/portfolio/history"),
      ]);
      if (!pRes.ok) throw new Error("Failed to load portfolio");
      const data = await pRes.json();
      setPortfolio(data);
      if (hRes.ok) {
        const hData = await hRes.json();
        setHistory(Array.isArray(hData) ? hData : []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const performPendingAction = async () => {
    if (!pendingAction || actionLoading) return;
    setActionLoading(true);
    try {
      if (pendingAction.type === "reset") {
        const res = await fetch("/api/reset", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Reset failed");
        toast("success", "Portfolio reset — a fresh $10,000 is ready to invest.");
      } else {
        const res = await fetch("/api/trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: pendingAction.symbol,
            tradeType: "SELL",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Sell failed");

        // Fire-and-forget AI debrief (no-op if no Anthropic key configured).
        if (data.tradeId) {
          fetch("/api/debrief", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tradeId: data.tradeId }),
          }).catch(() => {});
        }

        const sign = data.pnl >= 0 ? "+" : "−";
        toast(
          data.pnl >= 0 ? "success" : "info",
          `Sold all ${pendingAction.symbol}. Realized P&L: ${sign}$${Math.abs(
            data.pnl
          ).toFixed(2)}.`
        );
      }

      setPendingAction(null);
      setIsLoading(true);
      await fetchPortfolio();
    } catch (err: any) {
      toast("error", err.message);
      setPendingAction(null);
    } finally {
      setActionLoading(false);
    }
  };

  const totalValue = portfolio?.total_portfolio_value ?? 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 animate-fade-up">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Your portfolio at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setPendingAction({ type: "reset" })}
            disabled={actionLoading}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Link href="/explore">
            <Button className="gap-2 bg-gradient-to-r from-[oklch(0.65_0.18_270)] to-[oklch(0.55_0.2_280)] hover:opacity-90 transition-opacity text-white border-0 shadow-lg shadow-[oklch(0.65_0.18_270_/_20%)]">
              <Search className="h-4 w-4" />
              Find Stocks
            </Button>
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="glass-card p-6 text-center mb-8 animate-fade-up">
          <p className="text-destructive font-medium">{error}</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => {
              setError(null);
              setIsLoading(true);
              fetchPortfolio();
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Portfolio Card */}
      <div className="mb-8 animate-fade-up-delay-1">
        <PortfolioCard
          totalValue={portfolio?.total_portfolio_value ?? 0}
          cashBalance={portfolio?.cash_balance ?? 0}
          investedValue={portfolio?.total_market_value ?? 0}
          totalPnl={portfolio?.total_unrealized_pnl ?? 0}
          isLoading={isLoading}
        />
      </div>

      {/* Portfolio Value Chart */}
      <div className="mb-8 animate-fade-up-delay-1">
        <div className="glass-card p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Portfolio Value Over Time
          </h2>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <PortfolioChart data={history} />
          )}
        </div>
      </div>

      {/* Positions Section */}
      <div className="animate-fade-up-delay-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Open Positions
          </h2>
          {portfolio?.positions && portfolio.positions.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {portfolio.positions.length} stock
              {portfolio.positions.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="glass-card p-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : portfolio?.positions && portfolio.positions.length > 0 ? (
          <div className="glass-card overflow-hidden">
            {/* Table header (desktop only) */}
            <div className="hidden md:grid grid-cols-[1fr_0.7fr_0.7fr_0.7fr_0.7fr_0.5fr] gap-4 px-6 py-3 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Stock</span>
              <span className="text-right">Avg Cost</span>
              <span className="text-right">Current</span>
              <span className="text-right">Value</span>
              <span className="text-right">P&L</span>
              <span className="text-right">Action</span>
            </div>

            {/* Rows */}
            {portfolio.positions.map((pos) => {
              const isProfit = pos.unrealized_pnl >= 0;
              const allocation =
                totalValue > 0 ? (pos.market_value / totalValue) * 100 : 0;
              return (
                <div
                  key={pos.id}
                  className="border-b border-border/30 last:border-0"
                >
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-[1fr_0.7fr_0.7fr_0.7fr_0.7fr_0.5fr] gap-4 px-6 py-4 hover:bg-accent/30 transition-colors items-center">
                    <div>
                      <Link
                        href={`/trade/${pos.symbol}`}
                        className="font-bold text-foreground hover:text-primary transition-colors"
                      >
                        {pos.symbol}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {pos.company_name} · {pos.quantity} shares
                      </p>
                    </div>
                    <span className="text-right text-sm font-medium text-foreground">
                      ${pos.avg_buy_price.toFixed(2)}
                    </span>
                    <span className="text-right text-sm font-medium text-foreground">
                      ${pos.current_price.toFixed(2)}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-foreground">
                        $
                        {pos.market_value.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        {allocation.toFixed(1)}% of total
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-sm font-bold ${isProfit ? "text-profit" : "text-loss"}`}
                      >
                        {isProfit ? "+" : ""}$
                        {Math.abs(pos.unrealized_pnl).toFixed(2)}
                      </span>
                      <p
                        className={`text-[11px] font-medium ${isProfit ? "text-profit" : "text-loss"}`}
                      >
                        {isProfit ? "+" : ""}
                        {pos.pnl_percent.toFixed(2)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() =>
                          setPendingAction({ type: "sell", symbol: pos.symbol })
                        }
                        disabled={actionLoading}
                      >
                        Sell
                      </Button>
                    </div>
                  </div>

                  {/* Mobile card */}
                  <div className="md:hidden p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <Link
                          href={`/trade/${pos.symbol}`}
                          className="font-bold text-foreground text-base"
                        >
                          {pos.symbol}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">
                          {pos.company_name} · {pos.quantity} shares
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-bold ${isProfit ? "text-profit" : "text-loss"}`}
                        >
                          {isProfit ? "+" : ""}$
                          {Math.abs(pos.unrealized_pnl).toFixed(2)}
                        </p>
                        <p
                          className={`text-[11px] font-medium ${isProfit ? "text-profit" : "text-loss"}`}
                        >
                          {isProfit ? "+" : ""}
                          {pos.pnl_percent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                      <div className="rounded-lg bg-accent/30 py-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Avg
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          ${pos.avg_buy_price.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-accent/30 py-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Current
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          ${pos.current_price.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-accent/30 py-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Value
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          $
                          {pos.market_value.toLocaleString("en-US", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-9 text-sm border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() =>
                        setPendingAction({ type: "sell", symbol: pos.symbol })
                      }
                      disabled={actionLoading}
                    >
                      Sell All
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="glass-card p-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-accent/50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              No positions yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Start by exploring the stock market and making your first paper
              trade. You have $10,000 in virtual cash to invest.
            </p>
            <Link href="/explore">
              <Button className="gap-2 bg-gradient-to-r from-[oklch(0.65_0.18_270)] to-[oklch(0.55_0.2_280)] hover:opacity-90 transition-opacity text-white border-0">
                Explore Stocks
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Confirmation dialog for Reset / Sell All */}
      <ConfirmDialog
        open={pendingAction !== null}
        title={
          pendingAction?.type === "reset"
            ? "Reset portfolio?"
            : `Sell all ${pendingAction?.type === "sell" ? pendingAction.symbol : ""} shares?`
        }
        description={
          pendingAction?.type === "reset"
            ? "This permanently deletes all positions and trade history, and restores your $10,000 starting balance. This can't be undone."
            : "Your entire position will be sold at the current market price and the realized P&L recorded in your history."
        }
        confirmLabel={pendingAction?.type === "reset" ? "Reset" : "Sell All"}
        destructive
        loading={actionLoading}
        onConfirm={performPendingAction}
        onCancel={() => {
          if (!actionLoading) setPendingAction(null);
        }}
      />
    </div>
  );
}
