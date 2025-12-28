/**
 * Chart Tabs Component
 * Displays Price History and Depth Chart with real-time data
 */

'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { useSmartSocket } from '@/hooks/useSmartSocket';
import { useDepthChartData } from '@/hooks/useDepthChartData';
import { formatCurrency } from '@/lib/utils/utils';
import { ChartSkeleton } from './skeleton/ChartSkeleton';

// Dynamic imports with loading fallback
const PriceHistoryChart = dynamic(
  () => import('./price-history-chart/PriceHistoryChart').then((mod) => ({ default: mod.PriceHistoryChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

const DepthChart = dynamic(
  () => import('./depth-chart/DepthChart').then((mod) => ({ default: mod.DepthChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

interface ChartTabsProps {
  assetId: string;
  initialPrice: number;
}

export function ChartTabs({ assetId, initialPrice }: ChartTabsProps) {
  const {
    isConnected,
    priceHistory,
    bids,
    asks,
    currentPrice,
    spread,
    bestBid,
    bestAsk,
  } = useSmartSocket({ assetId, initialPrice });

  const depthChartData = useDepthChartData(bids, asks, currentPrice);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Market Data</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
              {isConnected ? '🟢 Live' : '🔴 Offline'}
            </Badge>
            {spread > 0 && (
              <Badge variant="outline" className="text-xs">
                Spread: {formatCurrency(spread)}
              </Badge>
            )}
          </div>
        </div>

        {/* Price Summary */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <span className="text-green-500">Bid:</span>{' '}
            {bestBid ? formatCurrency(bestBid) : '—'}
          </span>
          <span className="font-bold text-foreground">
            {formatCurrency(currentPrice)}
          </span>
          <span>
            <span className="text-red-500">Ask:</span>{' '}
            {bestAsk ? formatCurrency(bestAsk) : '—'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-1 md:px-4 pt-0">
        <Tabs defaultValue="price" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="price" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Price History
            </TabsTrigger>
            <TabsTrigger value="depth" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Market Depth
            </TabsTrigger>
          </TabsList>

          <TabsContent value="price" className="h-[400px]">
            <Suspense fallback={<ChartSkeleton />}>
              <PriceHistoryChart data={priceHistory} />
            </Suspense>
          </TabsContent>

          <TabsContent value="depth" className="h-[400px]">
            <Suspense fallback={<ChartSkeleton />}>
              <DepthChart data={depthChartData} currentPrice={currentPrice} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
