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
  priceChange24h?: number;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
  orderIds?: string[];
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


/**
 * Order notification shown in toast
 */
export interface OrderNotification {
  kind: string;
  orderId: string;
  assetId: string;
  timestamp: number;
  side?: string;
  quantity?: number; // Only for 'filled' kind
  price?: number; // Only for 'filled' kind
}

/**
 * Place order request sent to server via Socket.io
 */
export interface PlaceOrderRequest {
  assetId: string;
  userId: string;
  type: 'buy' | 'sell';
  quantity: number;
  orderType: 'market' | 'limit';
  price?: number; // Required for limit orders, undefined for market
}

/**
 * Server acknowledgment for place order
 */
export interface PlaceOrderAck {
  ok: boolean;
  error?: string;
  order?: {
    id: string;
    assetId: string;
    type: 'buy' | 'sell';
    quantity: number;
    price?: number;
    status: 'open' | 'filled' | 'cancelled';
    createdAt: string;
  };
  totalCost?: number;
}
