/**
 * Order Book Table Component
 * Desktop view with horizontal split layout
 */

'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { OrderBookEntry } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/utils/utils';
import { calculateDepthPercentage } from '@/lib/utils/chart-utils';

interface OrderBookTableProps {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  currentPrice: number;
  spread: number;
  maxQuantity: number;
}

export const OrderBookTable = React.memo(function OrderBookTable({
  bids,
  asks,
  currentPrice,
  spread,
  maxQuantity,
}: OrderBookTableProps) {
  // Take top 10 bids and asks
  const topBids = bids.slice(0, 10);
  const topAsks = asks.slice(0, 10);

  // Create combined rows (pair bids with asks)
  const maxRows = Math.max(topBids.length, topAsks.length);
  const rows = Array.from({ length: maxRows }, (_, i) => ({
    bid: topBids[i],
    ask: topAsks[i],
  }));

  return (
    <div className="h-[400px] overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-card z-10">
          <TableRow className="border-none">
            <TableHead className="text-green-500 text-right">Size</TableHead>
            <TableHead className="text-green-500 text-right">Bid</TableHead>
            <TableHead className="text-red-500">Ask</TableHead>
            <TableHead className="text-red-500">Size</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index} className="hover:bg-muted/50 border-none h-8">
              {/* Bid Size */}
              <TableCell className="p-0 text-center">
                {row.bid && (
                  <span className="font-mono ">
                    {row.bid.quantity}
                  </span>
                )}
              </TableCell>

              {/* Bid Price */}
              <TableCell className="p-0 text-right pr-2">
                {row.bid && (
                  <DepthCell
                    value={row.bid.quantity}
                    displayValue={row.bid.price}
                    maxQuantity={maxQuantity}
                    type="bid"
                    align="right"
                  />
                  // <span className="font-mono text-green-500">
                  //   {formatCurrency(row.bid.price)}
                  // </span>
                )}
              </TableCell>

              {/* Ask Price */}
              <TableCell className="p-0 pl-2">
                {row.ask && (
                  <DepthCell
                    value={row.ask.quantity}
                    displayValue={row.ask.price}
                    maxQuantity={maxQuantity}
                    type="ask"
                    align="left"
                  />
                )}
              </TableCell>

              {/* Ask Size */}
              <TableCell className="p-0 text-center">
                {row.ask && (
                  <span className="font-mono ">
                    {row.ask.quantity}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}

          {/* Spread Row */}
          <TableRow className="bg-muted/30 border-y">
            <TableCell colSpan={2} className="text-right text-sm text-muted-foreground">
              {formatCurrency(currentPrice)}
            </TableCell>
            <TableCell colSpan={2} className="text-left text-sm text-muted-foreground">
              Spread: {formatCurrency(spread)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
});

OrderBookTable.displayName = 'OrderBookTable';

/**
 * Depth Cell with CSS variable optimization
 */
interface DepthCellProps {
  value: number;
  displayValue: number;
  maxQuantity: number;
  type: 'bid' | 'ask';
  align: 'left' | 'right';
}

const DepthCell = React.memo(function DepthCell({
  value,
  displayValue,
  maxQuantity,
  type,
  align,
}: DepthCellProps) {
  const percentage = calculateDepthPercentage(value, maxQuantity);
  const isBid = type === 'bid';

  return (
    <div
      className="relative w-full py-1 px-2"
      style={{ '--order-depth': `${percentage}%` } as React.CSSProperties}
    >
      {/* Depth bar using CSS variable */}
      <div
        className={`absolute inset-y-0 top-0 h-6 opacity-25 ${align === 'right' ? 'right-0' : 'left-0'
          } ${isBid ? 'bg-bid-color ' : 'bg-ask-color '}`}
        style={{ width: 'var(--order-depth)' }}
      />

      {/* Value */}
      <span
        className={`relative z-10 font-mono text-sm ${align === 'right' ? 'float-right' : 'float-left'
          } ${isBid ? 'text-green-500' : 'text-red-500'}`}
      >
        {formatCurrency(displayValue)}
      </span>
    </div>
  );
});

DepthCell.displayName = 'DepthCell';