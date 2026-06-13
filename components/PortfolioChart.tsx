"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Snapshot {
  total_value: number;
  cash_balance: number;
  created_at: string;
}

interface PortfolioChartProps {
  data: Snapshot[];
}

export default function PortfolioChart({ data }: PortfolioChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      value: Number(item.total_value),
      label: new Date(item.created_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    }));
  }, [data]);

  // Need at least 2 points to draw a meaningful line.
  if (!data || data.length < 2) {
    return (
      <div className="h-64 flex flex-col items-center justify-center rounded-xl border border-dashed border-border text-center px-6">
        <p className="text-muted-foreground text-sm font-medium">
          Not enough history yet
        </p>
        <p className="text-muted-foreground/70 text-xs mt-1 max-w-xs">
          Your portfolio value will be charted here as you make trades.
        </p>
      </div>
    );
  }

  const values = chartData.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1 || 100;
  const domain = [Math.max(0, min - padding), max + padding];

  // Green if up vs. the first snapshot, red if down.
  const isUp = values[values.length - 1] >= values[0];
  const strokeColor = isUp ? "oklch(0.72 0.19 165)" : "oklch(0.68 0.2 25)";
  const gradientId = isUp ? "portfolioGradientUp" : "portfolioGradientDown";

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 0, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="portfolioGradientUp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.72 0.19 165)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="oklch(0.72 0.19 165)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="portfolioGradientDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.68 0.2 25)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="oklch(0.68 0.2 25)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="oklch(0.28 0.02 260)"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "oklch(0.55 0.02 260)" }}
            minTickGap={40}
          />
          <YAxis
            domain={domain}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "oklch(0.55 0.02 260)" }}
            tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
            width={48}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid oklch(0.28 0.02 260)",
              background: "oklch(0.17 0.015 260 / 90%)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px -4px rgb(0 0 0 / 0.4)",
            }}
            itemStyle={{ color: "oklch(0.95 0.01 260)", fontWeight: "600" }}
            formatter={(value) => [
              `$${Number(value).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
              "Portfolio Value",
            ]}
            labelStyle={{
              color: "oklch(0.65 0.02 260)",
              marginBottom: "4px",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 4,
              strokeWidth: 0,
              fill: strokeColor,
              style: { filter: `drop-shadow(0 0 6px ${strokeColor})` },
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
