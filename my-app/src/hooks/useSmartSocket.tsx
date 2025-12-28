/**
 * Smart Socket.io hook for Asset Detail page
 * Ref-counted subscription lifecycle + per-asset selectors
 */

'use client';

import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import type { PriceHistoryPoint } from '@/lib/utils/chart-utils';

const EMPTY_PRICE_HISTORY: PriceHistoryPoint[] = [];
if (process.env.NODE_ENV === 'development') Object.freeze(EMPTY_PRICE_HISTORY);

interface UseSmartSocketOptions {
  assetId: string;
  initialPrice?: number;
}

export function useSmartSocket({ assetId, initialPrice }: UseSmartSocketOptions) {
  const isConnected = useSocketStore((s) => s.isConnected);
  const retainAsset = useSocketStore((s) => s.retainAsset);
  const releaseAsset = useSocketStore((s) => s.releaseAsset);

  // Select raw state slices (avoid calling store methods in selectors)
  const orderBook = useSocketStore((s) => s.orderBooksByAssetId[assetId]);
  const priceHistory = useSocketStore(
    (s) => s.priceHistoryByAssetId[assetId] ?? EMPTY_PRICE_HISTORY
  );

  useEffect(() => {
    retainAsset(assetId, initialPrice);
    return () => releaseAsset(assetId);
  }, [assetId, initialPrice, retainAsset, releaseAsset]);

  return {
    isConnected,
    orderBook,
    priceHistory,
    currentPrice: orderBook?.currentPrice ?? initialPrice ?? 0,
    spread: orderBook?.spread ?? 0,
    bestBid: orderBook?.bestBid,
    bestAsk: orderBook?.bestAsk,
    bids: orderBook?.bids ?? [],
    asks: orderBook?.asks ?? [],
  };
}