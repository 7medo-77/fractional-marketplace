/**
 * Custom hook for Socket.io integration
 * Handles connection lifecycle and provides clean API
 */

'use client';

import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socketStore';

export function useSocket() {
  const { socket, isConnected, connect, disconnect } = useSocketStore();

  useEffect(() => {
    // Connect on mount
    connect();

    // Cleanup on unmount
    return () => {
      // disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket,
    isConnected,
  };
}

/**
 * Hook to get live asset price
 */
export function useAssetPrice(assetId: string, initialPrice: number) {
  const getAssetPrice = useSocketStore((state) => state.getAssetPrice);
  const livePrice = getAssetPrice(assetId);

  return livePrice ?? initialPrice;
}