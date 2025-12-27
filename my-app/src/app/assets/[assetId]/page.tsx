/**
 * Asset Detail Page - Server Component
 * Fetches initial asset data and renders client components
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getAssetById } from '@/lib/api';
import { AssetInfo } from '@/components/asset-detail/AssetInfo';
import { ChartTabs } from '@/components/asset-detail/ChartTabs';
import { OrderBookPanel } from '@/components/asset-detail/OrderBookPanel';
import { AssetDetailSkeleton } from '@/components/asset-detail/AssetDetailSkeleton';

interface AssetDetailPageProps {
  params: Promise<{ assetId: string }>;
}

/**
 * Main Asset Detail Page Component
 */
export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { assetId } = await params;

  // Fetch initial data server-side
  let asset;
  try {
    asset = await getAssetById(assetId);
  } catch (error) {
    console.error('Failed to fetch asset data:', error);
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Asset Info Header */}
      <AssetInfo asset={asset} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Charts Section (2/3 width on desktop) */}
        <div className="lg:col-span-2">
          <Suspense fallback={<AssetDetailSkeleton />}>
            <ChartTabs assetId={assetId} initialPrice={asset.currentPrice} />
          </Suspense>
        </div>

        {/* Order Book Section (1/3 width on desktop) */}
        <div className="lg:col-span-1">
          <Suspense fallback={<AssetDetailSkeleton />}>
            <OrderBookPanel assetId={assetId} initialPrice={asset.currentPrice} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
