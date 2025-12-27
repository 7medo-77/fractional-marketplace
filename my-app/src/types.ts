/**
 * Core domain types for the Fractional Marketplace
 * Matches backend models from backend/src/models/
 */

export interface Asset {
  id: string;
  name: string;
  description: string;
  category: 'real-estate' | 'vehicles' | 'collectibles';
  totalShares: number;
  availableShares: number;
  currentPrice: number;
  priceHistory: Array<{ price: number; timestamp: string }>;
  priceChange24h?: number; // Computed by backend
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBook {
  assetId: string;
  currentPrice: number;
  spread: number;
  bestBid?: number;
  bestAsk?: number;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastUpdated: string;
}

export interface Order {
  id: string;
  assetId: string;
  userId: string;
  type: 'bid' | 'ask';
  orderType: 'limit' | 'market';
  quantity: number;
  price?: number;
  status: 'open' | 'filled' | 'partial' | 'cancelled';
  createdAt: string;
  filledAt?: string;
}

export interface Trade {
  id: string;
  assetId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  price: number;
  executedAt: string;
}

/**
 * API Request/Response types
 */
export interface PlaceLimitOrderRequest {
  assetId: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  userId: string;
}

export interface PlaceMarketOrderRequest {
  assetId: string;
  type: 'buy' | 'sell';
  quantity: number;
  userId: string;
}

export interface PlaceMarketOrderResponse {
  order: Order;
  totalCost?: number;
}

/**
 * API Error types
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}