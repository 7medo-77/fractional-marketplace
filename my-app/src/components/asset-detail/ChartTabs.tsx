/**
 * Chart Tabs Component
 * Displays Price History and Depth Chart with real-time data
 */

'use client';

import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { PriceHistoryChart } from './PriceHistoryChart';
import { DepthChart } from './DepthChart';
import { useSmartSocket } from '@/hooks/useSmartSocket';
import { prepareDepthChartData } from '@/lib/chart-utils';
import { formatCurrency } from '@/lib/format-utils';

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

  // Prepare depth chart data
  const depthChartData = useMemo(() => {
    if (bids.length === 0 && asks.length === 0) return [];
    return prepareDepthChartData(bids, asks, currentPrice);
  }, [bids, asks, currentPrice]);

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

      <CardContent className="pt-0">
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

          <TabsContent value="price" className="h-[300px]">
            <PriceHistoryChart data={priceHistory} />
          </TabsContent>

          <TabsContent value="depth" className="h-[300px]">
            <DepthChart data={depthChartData} currentPrice={currentPrice} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
