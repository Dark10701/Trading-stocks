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

interface HistoryData {
  c: number; // close
  t: number; // timestamp
}

interface StockChartProps {
  data: HistoryData[];
  compact?: boolean;
}

export default function StockChart({ data, compact = false }: StockChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      price: item.c,
      date: new Date(item.t).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div
        className={`${compact ? "h-40" : "h-64"} flex items-center justify-center rounded-xl border border-dashed border-border`}
      >
        <p className="text-muted-foreground text-sm">
          No chart data available
        </p>
      </div>
    );
  }

  // Calculate min and max for better Y-axis scaling
  const prices = data.map((d) => d.c);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = (max - min) * 0.1 || 1;
  const domain = [Math.max(0, min - padding), max + padding];

  // Determine if price went up or down overall
  const isUp = data[data.length - 1].c >= data[0].c;
  const strokeColor = isUp ? "oklch(0.72 0.19 165)" : "oklch(0.68 0.2 25)";
  const gradientId = isUp ? "chartGradientUp" : "chartGradientDown";

  return (
    <div className={`${compact ? "h-40" : "h-64"} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 0, left: compact ? -30 : -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="chartGradientUp" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="oklch(0.72 0.19 165)"
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor="oklch(0.72 0.19 165)"
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient
              id="chartGradientDown"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="oklch(0.68 0.2 25)"
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor="oklch(0.68 0.2 25)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="oklch(0.28 0.02 260)"
          />
          {!compact && (
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "oklch(0.55 0.02 260)" }}
              minTickGap={30}
            />
          )}
          <YAxis
            domain={domain}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "oklch(0.55 0.02 260)" }}
            tickFormatter={(val) => `$${val.toFixed(0)}`}
            hide={compact}
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
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
            labelStyle={{
              color: "oklch(0.65 0.02 260)",
              marginBottom: "4px",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 4,
              strokeWidth: 0,
              fill: strokeColor,
              style: {
                filter: `drop-shadow(0 0 6px ${strokeColor})`,
              },
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
