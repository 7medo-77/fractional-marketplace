/**
 * Asset Card Component
 * Displays asset information with real-time price updates
 *
 * Following clean code principles:
 * - Single Responsibility: Only displays asset data
 * - Uses custom hook for price updates
 * - Client Component for interactivity
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useAssetPrice } from '@/hooks/useSocket';
import type { AssetCardProps } from './AssetCard.types';
import { formatCurrency, formatNumber } from './AssetCard.utils';

export function AssetCard({ asset }: AssetCardProps) {
  // Get live price from WebSocket or use initial price
  const currentPrice = useAssetPrice(asset.id, asset.currentPrice);

  // Calculate price change
  const priceChange = currentPrice - asset.currentPrice;
  const priceChangePercent = (priceChange / asset.currentPrice) * 100;
  const isPriceUp = priceChange > 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl line-clamp-1">{asset.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {asset.description}
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            {asset.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price Section */}
        <div className="space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold">
              {formatCurrency(currentPrice)}
            </span>
            {priceChange !== 0 && (
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  isPriceUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {isPriceUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {isPriceUp ? '+' : ''}
                {priceChangePercent.toFixed(2)}%
              </div>
            )}
          </div>
        </div>

        {/* Shares Info */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Available Shares:</span>
            <span className="font-medium">
              {formatNumber(asset.availableShares)} / {formatNumber(asset.totalShares)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${(asset.availableShares / asset.totalShares) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Action Button */}
        <Button asChild className="w-full group-hover:bg-primary/90">
          <Link href={`/assets/${asset.id}`}>
            View Details
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}