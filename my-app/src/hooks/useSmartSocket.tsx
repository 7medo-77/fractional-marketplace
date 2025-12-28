/**
 * Smart Socket.io hook for Asset Detail page
 * Ref-counted subscription lifecycle + per-asset selectors
 */

'use client';

import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socketStore';

interface UseSmartSocketOptions {
  assetId: string;
  initialPrice?: number;
}

export function useSmartSocket({ assetId, initialPrice }: UseSmartSocketOptions) {
  const isConnected = useSocketStore((s) => s.isConnected);
  const retainAsset = useSocketStore((s) => s.retainAsset);
  const releaseAsset = useSocketStore((s) => s.releaseAsset);

  const orderBook = useSocketStore((s) => s.getOrderBook(assetId));
  const priceHistory = useSocketStore((s) => s.getPriceHistory(assetId));

  useEffect(() => {
    retainAsset(assetId, initialPrice);

    return () => {
      releaseAsset(assetId);
    };
  }, [assetId, initialPrice, retainAsset, releaseAsset]);
  console.log({ orderBook, priceHistory });

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