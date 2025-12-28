/**
 * Loading state for Asset Detail Page
 */

import { AssetDetailSkeleton } from '@/components/asset-detail/skeleton/AssetDetailSkeleton';

export default function AssetDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded-md bg-muted" />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Asset Info Skeleton */}
        <div className="lg:col-span-3">
          <AssetDetailSkeleton.AssetInfo />
        </div>

        {/* Center Column: Chart Area Skeleton */}
        <div className="lg:col-span-6">
          <AssetDetailSkeleton.ChartArea />
        </div>

        {/* Right Column: Order Book Skeleton */}
        <div className="lg:col-span-3">
          <AssetDetailSkeleton.OrderBook />
        </div>
      </div>
    </div>
  );
}
