/**
 * Mobile Order Book Ladder Component
 * Vertical depth-of-market display for mobile devices
 */

'use client';

import React from 'react';
import type { OrderBookEntry } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { calculateDepthPercentage } from '@/lib/chart-utils';

interface MobileOrderBookLadderProps {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  currentPrice: number;
  spread: number;
  maxQuantity: number;
}

export const MobileOrderBookLadder = React.memo(function MobileOrderBookLadder({
  bids,
  asks,
  currentPrice,
  spread,
  maxQuantity,
}: MobileOrderBookLadderProps) {
  // Sort asks descending (highest at top)
  const sortedAsks = [...asks].slice(0, 8).sort((a, b) => b.price - a.price);

  // Sort bids descending (highest at top, near middle)
  const sortedBids = [...bids].slice(0, 8);

  return (
    <div className="flex flex-col h-[500px] w-full bg-background font-mono text-sm overflow-hidden">
      {/* ASKS SECTION (Red) - uses flex-col-reverse */}
      <div className="flex-1 overflow-y-auto flex flex-col-reverse border-b">
        {sortedAsks.map((ask) => (
          <LadderRow
            key={ask.price}
            type="ask"
            price={ask.price}
            quantity={ask.quantity}
            maxQuantity={maxQuantity}
          />
        ))}
      </div>

      {/* SPREAD / CURRENT PRICE (Middle) */}
      <div className="py-3 bg-muted/30 flex justify-between px-4 border-y border-muted-foreground/20 shrink-0">
        <span className="text-lg font-bold">{formatCurrency(currentPrice)}</span>
        <span className="text-muted-foreground">
          Spread: {formatCurrency(spread)}
        </span>
      </div>

      {/* BIDS SECTION (Green) */}
      <div className="flex-1 overflow-y-auto">
        {sortedBids.map((bid) => (
          <LadderRow
            key={bid.price}
            type="bid"
            price={bid.price}
            quantity={bid.quantity}
            maxQuantity={maxQuantity}
          />
        ))}
      </div>
    </div>
  );
});

MobileOrderBookLadder.displayName = 'MobileOrderBookLadder';

/**
 * Ladder Row Component
 */
interface LadderRowProps {
  type: 'bid' | 'ask';
  price: number;
  quantity: number;
  maxQuantity: number;
}

const LadderRow = React.memo(function LadderRow({
  type,
  price,
  quantity,
  maxQuantity,
}: LadderRowProps) {
  const isAsk = type === 'ask';
  const depthPercent = calculateDepthPercentage(quantity, maxQuantity);

  return (
    <div
      className="relative flex justify-between px-4 py-2 hover:bg-muted/50 cursor-pointer active:bg-muted"
      style={{ '--order-depth': `${depthPercent}%` } as React.CSSProperties}
    >
      {/* Background Depth Bar */}
      <div
        className={`absolute inset-y-0 right-0 transition-all duration-100 ${
          isAsk ? 'bg-red-500/15' : 'bg-green-500/15'
        }`}
        style={{ width: 'var(--order-depth)' }}
      />

      {/* Price */}
      <span className={`relative z-10 ${isAsk ? 'text-red-500' : 'text-green-500'}`}>
        {formatCurrency(price)}
      </span>

      {/* Quantity */}
      <span className="relative z-10 text-muted-foreground">
        {formatNumber(quantity)}
      </span>
    </div>
  );
});

LadderRow.displayName = 'LadderRow';