/**
 * Asset Detail Page - Server Component
 * Fetches initial asset data and renders client components
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getAssetById } from '@/lib/api';
import { AssetInfo } from '@/components/asset-detail/AssetInfo';
import { ChartTabs } from '@/components/asset-detail';
import { OrderBookPanel } from '@/components/asset-detail/order-book/OrderBookPanel';
import { AssetDetailSkeleton } from '@/components/asset-detail/AssetDetailSkeleton';
import { TradeInterfaceWrapper } from '@/components/asset-detail/TradeInterfaceWrapper';

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
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<AssetDetailSkeleton.ChartArea />}>
            <ChartTabs assetId={assetId} initialPrice={asset.currentPrice} />
          </Suspense>
        </div>

        {/* Right Column: Trade Interface + Order Book */}
        <div className="lg:col-span-1 space-y-6">
          {/* Trade Interface */}
          <Suspense fallback={<AssetDetailSkeleton.OrderBook />}>
            <TradeInterfaceWrapper assetId={assetId} initialPrice={asset.currentPrice} />
          </Suspense>

          {/* Order Book */}
          <Suspense fallback={<AssetDetailSkeleton.OrderBook />}>
            <OrderBookPanel assetId={assetId} initialPrice={asset.currentPrice} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
