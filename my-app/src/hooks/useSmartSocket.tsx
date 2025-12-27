/**
 * Smart Socket.io hook for Asset Detail page
 * Manages subscription lifecycle and provides real-time data
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useAssetDetailStore } from '@/stores/assetDetailStore';

interface UseSmartSocketOptions {
  assetId: string;
  initialPrice?: number;
}

export function useSmartSocket({ assetId, initialPrice }: UseSmartSocketOptions) {
  const {
    isConnected,
    orderBook,
    priceHistory,
    subscribeToAsset,
    unsubscribeFromAsset,
  } = useAssetDetailStore();

  useEffect(() => {
    // Subscribe when component mounts
    subscribeToAsset(assetId, initialPrice);

    // Cleanup on unmount
    return () => {
      unsubscribeFromAsset();
    };
  }, [assetId, initialPrice, subscribeToAsset, unsubscribeFromAsset]);

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