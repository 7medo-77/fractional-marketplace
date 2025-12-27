/**
 * Skeleton components for Asset Detail page loading states
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Asset Info Skeleton
 */
function AssetInfoSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price */}
        <div className="space-y-2">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        </div>

        {/* Stats */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Chart Area Skeleton
 */
function ChartAreaSkeleton() {
  return (
    <Card>
      <CardHeader>
        {/* Tabs */}
        <div className="flex gap-2">
          <div className="h-9 w-28 animate-pulse rounded bg-muted" />
          <div className="h-9 w-28 animate-pulse rounded bg-muted" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart placeholder */}
        <div className="h-[350px] w-full animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

/**
 * Order Book Skeleton
 */
function OrderBookSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Header row */}
        <div className="flex justify-between">
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
        </div>

        {/* Ask rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={`ask-${i}`} className="flex justify-between">
            <div className="h-4 w-16 animate-pulse rounded bg-red-100 dark:bg-red-900/20" />
            <div className="h-4 w-12 animate-pulse rounded bg-muted" />
            <div className="h-4 w-14 animate-pulse rounded bg-muted" />
          </div>
        ))}

        {/* Spread */}
        <div className="flex justify-center py-2">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        </div>

        {/* Bid rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={`bid-${i}`} className="flex justify-between">
            <div className="h-4 w-16 animate-pulse rounded bg-green-100 dark:bg-green-900/20" />
            <div className="h-4 w-12 animate-pulse rounded bg-muted" />
            <div className="h-4 w-14 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Export as namespaced object
 */
export const AssetDetailSkeleton = {
  AssetInfo: AssetInfoSkeleton,
  ChartArea: ChartAreaSkeleton,
  OrderBook: OrderBookSkeleton,
};
