/**
 * Chart data transformation utilities
 * Following Single Responsibility Principle
 */

import type { OrderBookEntry } from '@/types';

export interface DepthChartPoint {
  price: number;
  bidDepth: number;
  askDepth: number;
}

export interface PriceHistoryPoint {
  time: string;
  price: number;
  timestamp: number;
}

/**
 * Transform order book data for depth chart
 * Calculates cumulative quantities for bid/ask sides
 *
 * @param bids - Array of bid order book entries
 * @param asks - Array of ask order book entries
 * @param currentPrice - Current market price
 * @returns Array of depth chart points sorted by price
 */
export function prepareDepthChartData(
  bids: OrderBookEntry[],
  asks: OrderBookEntry[],
  currentPrice: number
): DepthChartPoint[] {
  // Sort bids descending (highest first)
  const sortedBids = [...bids].sort((a, b) => b.price - a.price);

  // Sort asks ascending (lowest first)
  const sortedAsks = [...asks].sort((a, b) => a.price - b.price);

  // Calculate cumulative bid depth
  let bidCumulative = 0;
  const bidData: DepthChartPoint[] = sortedBids.map((bid) => {
    bidCumulative += bid.quantity;
    return {
      price: bid.price,
      bidDepth: bidCumulative,
      askDepth: 0,
    };
  }).reverse(); // Reverse so lower prices are first

  // Calculate cumulative ask depth
  let askCumulative = 0;
  const askData: DepthChartPoint[] = sortedAsks.map((ask) => {
    askCumulative += ask.quantity;
    return {
      price: ask.price,
      bidDepth: 0,
      askDepth: askCumulative,
    };
  });

  // Add current price as midpoint
  const midpoint: DepthChartPoint = {
    price: currentPrice,
    bidDepth: bidCumulative,
    askDepth: 0,
  };

  // Combine and sort all price points
  return [...bidData, midpoint, ...askData];
}

/**
 * Calculate max quantity for depth bar scaling
 * Used to normalize depth bars in order book visualizations
 *
 * @param entries - Array of order book entries
 * @returns Maximum quantity found, or 1 if empty
 */
export function calculateMaxQuantity(entries: OrderBookEntry[]): number {
  if (entries.length === 0) return 1;
  return Math.max(...entries.map((e) => e.quantity));
}

/**
 * Calculate depth percentage for visualization
 * Converts quantity to percentage of max for width calculations
 *
 * @param quantity - Current order quantity
 * @param maxQuantity - Maximum quantity in the order book
 * @returns Percentage value capped at 100
 */
export function calculateDepthPercentage(quantity: number, maxQuantity: number): number {
  if (maxQuantity === 0) return 0;
  return Math.min((quantity / maxQuantity) * 100, 100);
}

/**
 * Generate mock price history data for initial display
 * Creates realistic-looking historical price data with volatility
 *
 * @param currentPrice - Current asset price
 * @param points - Number of historical points to generate (default: 50)
 * @returns Array of price history points with timestamps
 */
export function generateMockPriceHistory(
  currentPrice: number,
  points = 50
): PriceHistoryPoint[] {
  const now = Date.now();
  const interval = 30000; // 30 seconds between points

  let price = currentPrice * 0.98; // Start 2% lower
  const volatility = 0.002; // 0.2% volatility per tick

  return Array.from({ length: points }, (_, i) => {
    // Random price movement with slight upward bias
    const change = (Math.random() - 0.48) * volatility * price;
    price = Math.max(price + change, price * 0.9);

    // Trend towards current price in last 30% of data
    if (i > points * 0.7) {
      price = price + (currentPrice - price) * 0.1;
    }

    const timestamp = now - (points - i) * interval;

    return {
      time: new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      price: Math.round(price * 100) / 100,
      timestamp,
    };
  });
}

/**
 * Calculate percentage (utility for backwards compatibility)
 *
 * @param value - Current value
 * @param total - Total value
 * @returns Percentage (0-100)
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}