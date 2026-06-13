"use client";

import { TrendingUp, TrendingDown, Wallet, BarChart3, DollarSign } from "lucide-react";

interface PortfolioCardProps {
  totalValue: number;
  cashBalance: number;
  investedValue: number;
  totalPnl: number;
  isLoading?: boolean;
}

function StatItem({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-accent/50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-lg font-bold text-foreground leading-tight mt-0.5">
          {value}
        </p>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
        )}
      </div>
    </div>
  );
}

export default function PortfolioCard({
  totalValue,
  cashBalance,
  investedValue,
  totalPnl,
  isLoading,
}: PortfolioCardProps) {
  if (isLoading) {
    return (
      <div className="glass-card gradient-border glow-primary p-5 sm:p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-3 w-20 shimmer rounded" />
              <div className="h-6 w-28 shimmer rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const pnlPercent =
    investedValue > 0 ? (totalPnl / investedValue) * 100 : 0;
  const isProfit = totalPnl >= 0;

  return (
    <div
      className={`glass-card gradient-border p-5 sm:p-8 ${isProfit ? "glow-green" : "glow-red"}`}
    >
      {/* Title row */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Portfolio Overview
        </h2>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            isProfit ? "bg-profit text-profit" : "bg-loss text-loss"
          }`}
        >
          {isProfit ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {isProfit ? "+" : ""}
          {pnlPercent.toFixed(2)}%
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatItem
          icon={BarChart3}
          label="Total Value"
          value={`$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <StatItem
          icon={Wallet}
          label="Cash Balance"
          value={`$${cashBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <StatItem
          icon={DollarSign}
          label="Invested"
          value={`$${investedValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <StatItem
          icon={isProfit ? TrendingUp : TrendingDown}
          label="Unrealized P&L"
          value={`${isProfit ? "+" : ""}$${Math.abs(totalPnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext={`${isProfit ? "+" : ""}${pnlPercent.toFixed(2)}%`}
        />
      </div>
    </div>
  );
}
