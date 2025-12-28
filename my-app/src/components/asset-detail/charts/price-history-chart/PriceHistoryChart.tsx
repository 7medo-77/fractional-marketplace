/**
 * Price History Chart Component
 * Financial-style line chart with angular lines (stepAfter)
 */

'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { PriceHistoryPoint } from '@/lib/utils/chart-utils';
import { formatCurrency } from '@/lib/utils/utils';

interface PriceHistoryChartProps {
  data: PriceHistoryPoint[];
}

export const PriceHistoryChart = React.memo(function PriceHistoryChart({
  data,
}: PriceHistoryChartProps) {
  // Calculate Y-axis domain with padding
  const { minPrice, maxPrice, currentPrice } = useMemo(() => {
    if (data.length === 0) {
      return { minPrice: 0, maxPrice: 100, currentPrice: 50 };
    }

    const prices = data.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || max * 0.05;

    return {
      minPrice: Math.floor(min - padding),
      maxPrice: Math.ceil(max + padding),
      currentPrice: data[data.length - 1]?.price ?? 0,
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Waiting for price data...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />

        <XAxis
          dataKey="time"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />

        <YAxis
          domain={[minPrice, maxPrice]}
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(value, 0)}
          width={60}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'var(--foreground)' }}
          formatter={(value: number) => [formatCurrency(value), 'Price']}
        />

        {/* Reference line at current price */}
        <ReferenceLine
          y={currentPrice}
          stroke="var(--muted-foreground)"
          strokeDasharray="3 3"
          strokeWidth={1}
        />

        {/* Angular line (financial style) */}
        <Line
          type="stepAfter"
          dataKey="price"
          stroke="var(--bid-color)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: 'var(--bid-color)' }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

PriceHistoryChart.displayName = 'PriceHistoryChart';