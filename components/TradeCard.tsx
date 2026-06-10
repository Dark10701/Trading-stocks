"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";

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

interface TradeCardProps {
  trade: Trade;
}

export default function TradeCard({ trade }: TradeCardProps) {
  const isBuy = trade.trade_type === "BUY";
  const isProfit = trade.pnl !== null && trade.pnl >= 0;
  const date = new Date(trade.traded_at);

  return (
    <div className="glass-card p-5 hover:bg-[oklch(0.2_0.02_260_/_60%)] transition-all duration-200 group">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Trade info */}
        <div className="flex items-start gap-3.5">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              isBuy ? "bg-profit" : "bg-loss"
            }`}
          >
            {isBuy ? (
              <ArrowDownRight className="h-5 w-5 text-profit" />
            ) : (
              <ArrowUpRight className="h-5 w-5 text-loss" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-foreground text-base">
                {trade.symbol}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isBuy
                    ? "bg-profit text-profit"
                    : "bg-loss text-loss"
                }`}
              >
                {trade.trade_type}
              </span>
            </div>
            {trade.company_name && (
              <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">
                {trade.company_name}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {trade.quantity} shares @ ${trade.price_at_trade.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Right: Value & P&L */}
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-foreground">
            ${trade.total_value.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          {trade.pnl !== null && (
            <p
              className={`text-sm font-semibold mt-0.5 ${
                isProfit ? "text-profit" : "text-loss"
              }`}
            >
              {isProfit ? "+" : ""}$
              {Math.abs(trade.pnl).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground mt-1">
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            ·{" "}
            {date.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* AI Debrief */}
      {trade.ai_debrief && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            AI Debrief
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {trade.ai_debrief}
          </p>
        </div>
      )}
    </div>
  );
}
