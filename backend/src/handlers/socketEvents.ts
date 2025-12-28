/**
 * Socket.io Event Names and Payload Types
 * Central contract for all WebSocket communication
 *
 * IMPORTANT: Keep in sync with frontend my-app/src/lib/socketEvents.ts
 */

// ===== CLIENT → SERVER EVENTS =====

export const CLIENT_EVENTS = {
  // Room subscriptions
  SUBSCRIBE_ASSET: 'subscribe_asset',
  UNSUBSCRIBE_ASSET: 'unsubscribe_asset',
  SUBSCRIBE_ALL_ASSETS: 'subscribe_all_assets',
  UNSUBSCRIBE_ALL_ASSETS: 'unsubscribe_all_assets',

  // Request/Response
  GET_ASSET_PRICE: 'get_asset_price',
  GET_ORDERBOOK: 'get_orderbook',

  // Order placement (POST-like)
  PLACE_LIMIT_ORDER: 'place_limit_order',
  PLACE_MARKET_ORDER: 'place_market_order',

  // User-specific subscriptions
  SUBSCRIBE_USER_ORDERS: 'subscribe_user_orders',
  UNSUBSCRIBE_USER_ORDERS: 'unsubscribe_user_orders',
} as const;

// ===== SERVER → CLIENT EVENTS =====

export const SERVER_EVENTS = {
  // Real-time updates
  ORDERBOOK_UPDATE: 'orderbook_update',
  ASSET_PRICE_UPDATE: 'asset_price_update',

  // Order confirmations
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_FILLED: 'order_filled', // New: specifically for limit order fills

  // Trade executions
  TRADE_EXECUTED: 'trade_executed',
} as const;

// ===== PAYLOAD TYPES =====

export interface OrderbookUpdatePayload {
  event: 'orderbook_update';
  data: {
    assetId: string;
    currentPrice: number;
    spread: number;
    bestBid?: number;
    bestAsk?: number;
    bids: Array<{
      price: number;
      quantity: number;
      total: number;
    }>;
    asks: Array<{
      price: number;
      quantity: number;
      total: number;
    }>;
    timestamp: string;
  };
}

export interface AssetPriceUpdatePayload {
  event: 'asset_price_update';
  data: {
    assetId: string;
    currentPrice: number;
    timestamp: string;
  };
}

export interface OrderConfirmedPayload {
  event: 'order_confirmed';
  data: {
    orderId: string;
    assetId: string;
    userId: string; // Added: for client-side filtering
    type: 'bid' | 'ask';
    orderType: 'limit' | 'market';
    quantity: number;
    price?: number;
    status: 'open' | 'filled' | 'partial' | 'cancelled';
    totalCost?: number;
    timestamp: string;
  };
}

export interface OrderFilledPayload {
  event: 'order_filled';
  data: {
    orderId: string;
    assetId: string;
    userId: string;
    type: 'bid' | 'ask';
    orderType: 'limit';
    quantity: number;
    price: number;
    status: 'filled';
    filledAt: string;
    tradeId: string;
    timestamp: string;
  };
}

export interface TradeExecutedPayload {
  event: 'trade_executed';
  data: {
    tradeId: string;
    assetId: string;
    buyerId: string;
    sellerId: string;
    quantity: number;
    price: number;
    timestamp: string;
  };
}

// ===== REQUEST PARAMS =====

export interface PlaceLimitOrderParams {
  assetId: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  userId: string;
}

export interface PlaceMarketOrderParams {
  assetId: string;
  type: 'buy' | 'sell';
  quantity: number;
  userId: string;
}

// ===== ROOM NAMES =====

export const ROOMS = {
  asset: (assetId: string) => `asset:${assetId}`,
  allAssets: 'assets:all',
  user: (userId: string) => `user:${userId}`, // New: per-user room for order updates
} as const;