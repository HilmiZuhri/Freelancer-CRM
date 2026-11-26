"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyRevenuePoint } from "@/lib/data/dashboard";
import { formatCurrency } from "@/lib/formatters";

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const value = Number(payload[0]?.value ?? 0);

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-primary font-medium mt-0.5">
        {formatCurrency(value, true)}
      </p>
    </div>
  );
}

export function RevenueChart({ data }: { data: MonthlyRevenuePoint[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[240px] w-full rounded-lg bg-muted/30 animate-pulse" />;
  }

  const hasAnyRevenue = data.some((d) => d.revenue > 0);

  return (
    <div className="relative h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border)"
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickFormatter={(value) =>
              value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`
            }
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          <Bar
            dataKey="revenue"
            fill="var(--primary)"
            radius={[6, 6, 0, 0]}
            maxBarSize={44}
          />
        </BarChart>
      </ResponsiveContainer>

      {!hasAnyRevenue && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="rounded-md bg-card/90 px-3 py-1.5 text-xs text-muted-foreground border border-border shadow-xs">
            Mark an invoice as Paid to visualize monthly earnings
          </p>
        </div>
      )}
    </div>
  );
}