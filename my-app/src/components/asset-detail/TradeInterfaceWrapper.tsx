/**
 * Trade Interface Wrapper
 * Connects TradeInterface to socket data from useSmartSocket
 *
 * This wrapper prevents duplicate socket connections by reusing
 * the existing useSmartSocket hook data
 */

'use client';

import React from 'react';
import { TradeInterface } from './TradeInterface';
import { useSmartSocket } from '@/hooks/useSmartSocket';

interface TradeInterfaceWrapperProps {
  assetId: string;
  initialPrice: number;
}

export function TradeInterfaceWrapper({ assetId, initialPrice }: TradeInterfaceWrapperProps) {
  const { isConnected, currentPrice, bestBid, bestAsk } = useSmartSocket({
    assetId,
    initialPrice,
  });

  return (
    <TradeInterface
      assetId={assetId}
      currentPrice={currentPrice}
      bestBid={bestBid}
      bestAsk={bestAsk}
      isConnected={isConnected}
    />
  );
}