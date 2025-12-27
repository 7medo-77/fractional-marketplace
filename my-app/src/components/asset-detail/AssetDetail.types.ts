/**
 * Type definitions for Asset Detail components
 */

import type { Asset, OrderBook, Trade } from '@/types';

// ===== Chart Tab Types =====

export type ChartTabValue = 'price' | 'depth';

export interface ChartTabsProps {
  assetId: string;
  initialOrderBook?: OrderBook;
}

// ===== Order Book Component Types =====

export interface OrderBookProps {
  assetId: string;
  initialOrderBook?: OrderBook;
}

export interface OrderBookDisplayProps {
  orderBook: OrderBook;
}

export interface OrderBookRowProps {
  price: number;
  quantity: number;
  total: number;
  type: 'bid' | 'ask';
  maxTotal: number;
}

// ===== Price History Types =====

export interface PricePoint {
  price: number;
  timestamp: string;
}

export interface PriceHistoryChartProps {
  assetId: string;
  priceHistory: PricePoint[];
}

// ===== Depth Chart Types =====

export interface DepthChartProps {
  assetId: string;
  orderBook: OrderBook;
}

export interface DepthDataPoint {
  price: number;
  bidVolume: number;
  askVolume: number;
}

// ===== Asset Info Types =====

export interface AssetInfoProps {
  asset: Asset;
}

export interface AssetHeaderProps {
  asset: Asset;
  currentPrice: number;
}

// ===== Hook Return Types =====

export interface UseSmartSocketIoReturn {
  orderBook: OrderBook | null;
  trades: Trade[];
  isConnected: boolean;
  error: string | null;
}

export interface UseOrderBookReturn {
  orderBook: OrderBook | null;
  isLoading: boolean;
  error: string | null;
}
