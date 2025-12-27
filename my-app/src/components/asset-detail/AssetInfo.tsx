/**
 * Asset Info Component
 * Displays asset header information with real-time price
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useAssetPrice } from '@/hooks/useSocket';
import type { Asset } from '@/types';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';

interface AssetInfoProps {
  asset: Asset;
}

export function AssetInfo({ asset }: AssetInfoProps) {
  // Get live price from socket
  const currentPrice = useAssetPrice(asset.id, asset.currentPrice);

  // Calculate price change
  const priceChange = currentPrice - asset.currentPrice;
  const priceChangePercent = (priceChange / asset.currentPrice) * 100;
  const isPriceUp = priceChange > 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Asset Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{asset.name}</h1>
              <Badge variant="outline">{asset.category}</Badge>
            </div>
            <p className="text-muted-foreground max-w-xl">{asset.description}</p>
          </div>

          {/* Price and Stats */}
          <div className="flex flex-col items-end gap-2">
            {/* Current Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">
                {formatCurrency(currentPrice)}
              </span>
              {priceChange !== 0 && (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    isPriceUp
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {isPriceUp ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {formatPercentage(priceChangePercent)}
                </div>
              )}
            </div>

            {/* Shares Info */}
            <div className="text-sm text-muted-foreground">
              {formatNumber(asset.availableShares)} / {formatNumber(asset.totalShares)} shares available
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
