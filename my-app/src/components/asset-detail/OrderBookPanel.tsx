/**
 * Order Book Panel Component
 * Displays bids and asks with depth visualization
 */

'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSmartSocket } from '@/hooks/useSmartSocket';
import { useIsMobile } from '@/hooks/useIsMobile';
import { OrderBookTable } from './OrderBookTable';
import { MobileOrderBookLadder } from './MobileOrderBookLadder';
import { formatCurrency } from '@/lib/format-utils';
import { calculateMaxQuantity } from '@/lib/chart-utils';

interface OrderBookPanelProps {
  assetId: string;
  initialPrice: number;
}

export function OrderBookPanel({ assetId, initialPrice }: OrderBookPanelProps) {
  const isMobile = useIsMobile();
  const { isConnected, bids, asks, currentPrice, spread } = useSmartSocket({
    assetId,
    initialPrice,
  });

  // Calculate max quantity for depth bar scaling
  const maxBidQuantity = useMemo(() => calculateMaxQuantity(bids), [bids]);
  const maxAskQuantity = useMemo(() => calculateMaxQuantity(asks), [asks]);
  const maxQuantity = Math.max(maxBidQuantity, maxAskQuantity, 1);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Order Book</CardTitle>
          <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
            {isConnected ? '🟢 Live' : '🔴 Offline'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isMobile ? (
          <MobileOrderBookLadder
            bids={bids}
            asks={asks}
            currentPrice={currentPrice}
            spread={spread}
            maxQuantity={maxQuantity}
          />
        ) : (
          <OrderBookTable
            bids={bids}
            asks={asks}
            currentPrice={currentPrice}
            spread={spread}
            maxQuantity={maxQuantity}
          />
        )}
      </CardContent>
    </Card>
  );
}
