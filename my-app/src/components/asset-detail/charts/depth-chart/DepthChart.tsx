/**
 * Depth Chart Component
 * Area chart showing cumulative bid/ask depth
 */

'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { DepthChartPoint } from '@/lib/chart-utils';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface DepthChartProps {
  data: DepthChartPoint[];
  currentPrice: number;
}

export const DepthChart = React.memo(function DepthChart({
  data,
  currentPrice,
}: DepthChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Waiting for order book data...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          {/* Bid gradient (green) */}
          <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--bid-color)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--bid-color)" stopOpacity={0.1} />
          </linearGradient>

          {/* Ask gradient (red) */}
          <linearGradient id="askGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--ask-color)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--ask-color)" stopOpacity={0.1} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />

        <XAxis
          dataKey="price"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(value, 0)}
        />

        <YAxis
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatNumber(value)}
          width={50}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
          formatter={(value: number, name: string) => [
            formatNumber(value),
            name === 'bidDepth' ? 'Bid Depth' : 'Ask Depth',
          ]}
          labelFormatter={(label) => `Price: ${formatCurrency(label)}`}
        />

        {/* Reference line at current price */}
        <ReferenceLine
          x={currentPrice}
          stroke="var(--foreground)"
          strokeDasharray="5 5"
          strokeWidth={2}
          label={{
            value: 'Current',
            position: 'top',
            fill: 'var(--foreground)',
            fontSize: 10,
          }}
        />

        {/* Bid depth area (green) */}
        <Area
          type="stepAfter"
          dataKey="bidDepth"
          stroke="var(--bid-color)"
          strokeWidth={2}
          fill="url(#bidGradient)"
          isAnimationActive={false}
        />

        {/* Ask depth area (red) */}
        <Area
          type="stepAfter"
          dataKey="askDepth"
          stroke="var(--ask-color)"
          strokeWidth={2}
          fill="url(#askGradient)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

DepthChart.displayName = 'DepthChart';