Collecting workspace information# Analysis: `useSmartSocket` vs `useSmartSocketIo`

## Key Differences

| Feature | `useSmartSocket` | `useSmartSocketIo` |
|---------|------------------|-------------------|
| **State Management** | Uses Zustand store (`useAssetDetailStore`) | Uses local React state |
| **Performance Optimization** | None | `requestAnimationFrame` buffering |
| **Trade Events** | ❌ Not handled | ✅ Handles `TRADE_EXECUTED` |
| **Order Events** | ❌ Not handled | ✅ Ready for `ORDER_CONFIRMED` |
| **Tab-aware Subscriptions** | ❌ No | ✅ Yes (receives `activeTab` param) |
| **Error Handling** | ❌ Basic | ✅ Proper error state |
| **Reconnection** | Handled by store | Handled locally with callbacks |

## `useSmartSocketIo` Advantages

### 1. **RequestAnimationFrame Buffering**
```typescript
// Buffers rapid updates to prevent UI jank
const bufferOrderBookUpdate = useCallback((data: OrderBook) => {
  pendingOrderBookUpdate.current = data;
  if (rafIdRef.current === null) {
    rafIdRef.current = requestAnimationFrame(processUpdates);
  }
}, [processUpdates]);
```

### 2. **Trade Event Handling**
```typescript
socket.on(SERVER_EVENTS.TRADE_EXECUTED, handleTradeExecuted);

const handleTradeExecuted = (payload: TradeExecutedPayload) => {
  if (payload.data.assetId === assetId) {
    bufferTradeUpdate({
      id: payload.data.tradeId,
      // ... trade data
    });
  }
};
```

### 3. **Tab-Aware Subscriptions**
```typescript
useEffect(() => {
  // Can optimize subscriptions based on active tab
  console.log(`📊 Active tab changed to: ${activeTab}`);
}, [activeTab, assetId]);
```

---

## Consolidated Hook Implementation

Here's the unified hook that combines the best of both, ready for the order/trade flow:

````typescript
/**
 * Unified Smart Socket.io Hook
 *
 * Consolidates useSmartSocket and useSmartSocketIo into a single optimized hook.
 *
 * Features:
 * - RequestAnimationFrame buffering for smooth 500ms updates
 * - Handles orderbook, price, trade, and order events
 * - Tab-aware subscriptions for optimization
 * - Proper cleanup and reconnection handling
 * - Ready for order placement flow
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket, getSocket, disconnectSocket } from '@/lib/socket';
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  OrderbookUpdatePayload,
  AssetPriceUpdatePayload,
  TradeExecutedPayload,
  OrderConfirmedPayload,
  PlaceLimitOrderParams,
  PlaceMarketOrderParams,
} from '@/lib/socketEvents';
import type { OrderBook, OrderBookEntry, Trade, Order } from '@/types';
import { generateMockPriceHistory, PriceHistoryPoint } from '@/lib/chart-utils';

// ===== Types =====

export type ChartTabValue = 'price' | 'depth';

export interface UseUnifiedSocketOptions {
  assetId: string;
  initialPrice?: number;
  activeTab?: ChartTabValue;
  initialOrderBook?: OrderBook;
}

export interface OrderPlacementResult {
  success: boolean;
  order?: Order;
  totalCost?: number;
  error?: string;
}

export interface UseUnifiedSocketReturn {
  // Connection state
  isConnected: boolean;
  error: string | null;

  // Order book data
  orderBook: OrderBook | null;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  currentPrice: number;
  spread: number;
  bestBid: number | undefined;
  bestAsk: number | undefined;

  // Price history for charts
  priceHistory: PriceHistoryPoint[];

  // Trades
  trades: Trade[];
  recentTrades: Trade[];

  // User orders (for future use)
  userOrders: Order[];
  pendingOrders: Order[];

  // Actions
  placeLimitOrder: (params: Omit<PlaceLimitOrderParams, 'assetId'>) => Promise<OrderPlacementResult>;
  placeMarketOrder: (params: Omit<PlaceMarketOrderParams, 'assetId'>) => Promise<OrderPlacementResult>;
  refreshOrderBook: () => void;
}

// ===== Constants =====

const MAX_TRADES_HISTORY = 100;
const MAX_PRICE_HISTORY = 100;
const PRICE_HISTORY_INITIAL_POINTS = 50;

// ===== Hook Implementation =====

export function useUnifiedSocket({
  assetId,
  initialPrice = 5000,
  activeTab = 'price',
  initialOrderBook,
}: UseUnifiedSocketOptions): UseUnifiedSocketReturn {
  // ===== State =====
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(initialOrderBook ?? null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>(() =>
    generateMockPriceHistory(initialPrice, PRICE_HISTORY_INITIAL_POINTS)
  );

  // ===== Refs for RAF buffering =====
  const socketRef = useRef<Socket | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingOrderBookUpdate = useRef<OrderBook | null>(null);
  const pendingTradesUpdate = useRef<Trade[]>([]);
  const pendingPriceUpdate = useRef<PriceHistoryPoint | null>(null);

  // ===== Memoized values =====
  const bids = useMemo(() => orderBook?.bids ?? [], [orderBook?.bids]);
  const asks = useMemo(() => orderBook?.asks ?? [], [orderBook?.asks]);
  const currentPrice = useMemo(
    () => orderBook?.currentPrice ?? initialPrice,
    [orderBook?.currentPrice, initialPrice]
  );
  const spread = useMemo(() => orderBook?.spread ?? 0, [orderBook?.spread]);
  const bestBid = useMemo(() => orderBook?.bestBid, [orderBook?.bestBid]);
  const bestAsk = useMemo(() => orderBook?.bestAsk, [orderBook?.bestAsk]);
  const recentTrades = useMemo(() => trades.slice(0, 10), [trades]);
  const pendingOrders = useMemo(
    () => userOrders.filter((o) => o.status === 'open'),
    [userOrders]
  );

  // ===== RAF Processing =====
  const processBufferedUpdates = useCallback(() => {
    // Process order book update
    if (pendingOrderBookUpdate.current) {
      setOrderBook(pendingOrderBookUpdate.current);
      pendingOrderBookUpdate.current = null;
    }

    // Process trades update
    if (pendingTradesUpdate.current.length > 0) {
      setTrades((prev) => {
        const newTrades = [...pendingTradesUpdate.current, ...prev];
        pendingTradesUpdate.current = [];
        return newTrades.slice(0, MAX_TRADES_HISTORY);
      });
    }

    // Process price history update
    if (pendingPriceUpdate.current) {
      setPriceHistory((prev) => {
        const updated = [...prev, pendingPriceUpdate.current!];
        pendingPriceUpdate.current = null;
        return updated.slice(-MAX_PRICE_HISTORY);
      });
    }

    rafIdRef.current = null;
  }, []);

  const scheduleUpdate = useCallback(() => {
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(processBufferedUpdates);
    }
  }, [processBufferedUpdates]);

  // ===== Buffered Update Functions =====
  const bufferOrderBookUpdate = useCallback(
    (data: OrderbookUpdatePayload['data']) => {
      const newOrderBook: OrderBook = {
        assetId: data.assetId,
        currentPrice: data.currentPrice,
        spread: data.spread,
        bestBid: data.bestBid,
        bestAsk: data.bestAsk,
        bids: data.bids,
        asks: data.asks,
        lastUpdated: data.timestamp,
      };

      pendingOrderBookUpdate.current = newOrderBook;

      // Also add to price history
      pendingPriceUpdate.current = {
        time: new Date(data.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        price: data.currentPrice,
        timestamp: Date.now(),
      };

      scheduleUpdate();
    },
    [scheduleUpdate]
  );

  const bufferTradeUpdate = useCallback(
    (trade: Trade) => {
      pendingTradesUpdate.current.push(trade);
      scheduleUpdate();
    },
    [scheduleUpdate]
  );

  // ===== Order Handlers =====
  const handleOrderConfirmed = useCallback((payload: OrderConfirmedPayload) => {
    const orderData = payload.data;

    const order: Order = {
      id: orderData.orderId,
      assetId: orderData.assetId,
      userId: '', // Will be set by the server
      type: orderData.type,
      orderType: orderData.orderType,
      quantity: orderData.quantity,
      price: orderData.price,
      status: orderData.status,
      createdAt: orderData.timestamp,
    };

    setUserOrders((prev) => {
      // Update existing order or add new one
      const existingIndex = prev.findIndex((o) => o.id === order.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = order;
        return updated;
      }
      return [order, ...prev];
    });
  }, []);

  // ===== Order Placement Actions =====
  const placeLimitOrder = useCallback(
    async (params: Omit<PlaceLimitOrderParams, 'assetId'>): Promise<OrderPlacementResult> => {
      const socket = socketRef.current;

      if (!socket?.connected) {
        return { success: false, error: 'Not connected to server' };
      }

      return new Promise((resolve) => {
        socket.emit(
          CLIENT_EVENTS.PLACE_LIMIT_ORDER,
          { ...params, assetId },
          (response: { ok: boolean; order?: Order; error?: string }) => {
            if (response.ok && response.order) {
              resolve({ success: true, order: response.order });
            } else {
              resolve({ success: false, error: response.error || 'Failed to place order' });
            }
          }
        );
      });
    },
    [assetId]
  );

  const placeMarketOrder = useCallback(
    async (params: Omit<PlaceMarketOrderParams, 'assetId'>): Promise<OrderPlacementResult> => {
      const socket = socketRef.current;

      if (!socket?.connected) {
        return { success: false, error: 'Not connected to server' };
      }

      return new Promise((resolve) => {
        socket.emit(
          CLIENT_EVENTS.PLACE_MARKET_ORDER,
          { ...params, assetId },
          (response: { ok: boolean; order?: Order; totalCost?: number; error?: string }) => {
            if (response.ok && response.order) {
              resolve({
                success: true,
                order: response.order,
                totalCost: response.totalCost,
              });
            } else {
              resolve({ success: false, error: response.error || 'Failed to place order' });
            }
          }
        );
      });
    },
    [assetId]
  );

  const refreshOrderBook = useCallback(() => {
    const socket = socketRef.current;

    if (!socket?.connected) return;

    socket.emit(
      CLIENT_EVENTS.GET_ORDERBOOK,
      assetId,
      (response: OrderBook | { error: string }) => {
        if ('error' in response) {
          console.error('Failed to refresh order book:', response.error);
          return;
        }
        setOrderBook(response);
      }
    );
  }, [assetId]);

  // ===== Main Socket Effect =====
  useEffect(() => {
    if (!assetId) return;

    // Initialize socket
    const socket = getSocket() ?? initializeSocket();
    socketRef.current = socket;

    // ===== Event Handlers =====
    const handleConnect = () => {
      console.log(`🔌 Unified socket connected for asset: ${assetId}`);
      setIsConnected(true);
      setError(null);

      // Subscribe to asset room
      socket.emit(CLIENT_EVENTS.SUBSCRIBE_ASSET, assetId);
    };

    const handleDisconnect = (reason: string) => {
      console.log(`❌ Socket disconnected: ${reason}`);
      setIsConnected(false);
    };

    const handleConnectError = (err: Error) => {
      console.error('🔴 Socket connection error:', err);
      setError(err.message);
      setIsConnected(false);
    };

    const handleOrderBookUpdate = (payload: OrderbookUpdatePayload) => {
      if (payload.data.assetId === assetId) {
        bufferOrderBookUpdate(payload.data);
      }
    };

    const handlePriceUpdate = (payload: AssetPriceUpdatePayload) => {
      if (payload.data.assetId === assetId) {
        // Update current price in order book
        setOrderBook((prev) => {
          if (!prev) return prev;
          return { ...prev, currentPrice: payload.data.currentPrice };
        });

        // Add to price history
        pendingPriceUpdate.current = {
          time: new Date(payload.data.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          price: payload.data.currentPrice,
          timestamp: Date.now(),
        };
        scheduleUpdate();
      }
    };

    const handleTradeExecuted = (payload: TradeExecutedPayload) => {
      if (payload.data.assetId === assetId) {
        const trade: Trade = {
          id: payload.data.tradeId,
          assetId: payload.data.assetId,
          buyerId: payload.data.buyerId,
          sellerId: payload.data.sellerId,
          quantity: payload.data.quantity,
          price: payload.data.price,
          executedAt: payload.data.timestamp,
        };
        bufferTradeUpdate(trade);
      }
    };

    // ===== Register Event Listeners =====
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on(SERVER_EVENTS.ORDERBOOK_UPDATE, handleOrderBookUpdate);
    socket.on(SERVER_EVENTS.ASSET_PRICE_UPDATE, handlePriceUpdate);
    socket.on(SERVER_EVENTS.TRADE_EXECUTED, handleTradeExecuted);
    socket.on(SERVER_EVENTS.ORDER_CONFIRMED, handleOrderConfirmed);

    // Subscribe immediately if already connected
    if (socket.connected) {
      handleConnect();
    }

    // ===== Cleanup =====
    return () => {
      // Cancel pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      // Unsubscribe from asset
      if (socket.connected) {
        socket.emit(CLIENT_EVENTS.UNSUBSCRIBE_ASSET, assetId);
      }

      // Remove listeners
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off(SERVER_EVENTS.ORDERBOOK_UPDATE, handleOrderBookUpdate);
      socket.off(SERVER_EVENTS.ASSET_PRICE_UPDATE, handlePriceUpdate);
      socket.off(SERVER_EVENTS.TRADE_EXECUTED, handleTradeExecuted);
      socket.off(SERVER_EVENTS.ORDER_CONFIRMED, handleOrderConfirmed);
    };
  }, [assetId, bufferOrderBookUpdate, bufferTradeUpdate, handleOrderConfirmed, scheduleUpdate]);

  // ===== Tab-Specific Optimization Effect =====
  useEffect(() => {
    // Future: Could optimize by only subscribing to needed events based on tab
    // For now, we subscribe to everything since both tabs need orderbook data
    console.log(`📊 Active tab: ${activeTab} for asset: ${assetId}`);
  }, [activeTab, assetId]);

  // ===== Return =====
  return {
    // Connection
    isConnected,
    error,

    // Order book
    orderBook,
    bids,
    asks,
    currentPrice,
    spread,
    bestBid,
    bestAsk,

    // Price history
    priceHistory,

    // Trades
    trades,
    recentTrades,

    // User orders
    userOrders,
    pendingOrders,

    // Actions
    placeLimitOrder,
    placeMarketOrder,
    refreshOrderBook,
  };
}

// ===== Convenience Hooks =====

/**
 * Simple hook for order book data only
 */
export function useOrderBook(assetId: string, initialPrice?: number) {
  const { orderBook, bids, asks, currentPrice, spread, bestBid, bestAsk, isConnected, error } =
    useUnifiedSocket({ assetId, initialPrice });

  return {
    orderBook,
    bids,
    asks,
    currentPrice,
    spread,
    bestBid,
    bestAsk,
    isConnected,
    isLoading: !orderBook && !error,
    error,
  };
}

/**
 * Hook for price history chart data
 */
export function usePriceHistory(assetId: string, initialPrice?: number) {
  const { priceHistory, currentPrice, isConnected } = useUnifiedSocket({
    assetId,
    initialPrice,
    activeTab: 'price',
  });

  return {
    priceHistory,
    currentPrice,
    isConnected,
  };
}

/**
 * Hook for trading actions
 */
export function useTrading(assetId: string) {
  const { placeLimitOrder, placeMarketOrder, userOrders, pendingOrders, isConnected } =
    useUnifiedSocket({ assetId });

  return {
    placeLimitOrder,
    placeMarketOrder,
    userOrders,
    pendingOrders,
    isConnected,
  };
}
````

Now update the components to use the new unified hook:

````typescript
/**
 * Chart Tabs Component
 * Displays Price History and Depth Chart with real-time data
 */

'use client';

import React, { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { PriceHistoryChart } from './PriceHistoryChart';
import { DepthChart } from './DepthChart';
import { useUnifiedSocket, ChartTabValue } from '@/hooks/useUnifiedSocket';
import { prepareDepthChartData } from '@/lib/chart-utils';
import { formatCurrency } from '@/lib/format-utils';

interface ChartTabsProps {
  assetId: string;
  initialPrice: number;
}

export function ChartTabs({ assetId, initialPrice }: ChartTabsProps) {
  const [activeTab, setActiveTab] = useState<ChartTabValue>('price');

  const {
    isConnected,
    priceHistory,
    bids,
    asks,
    currentPrice,
    spread,
    bestBid,
    bestAsk,
  } = useUnifiedSocket({ assetId, initialPrice, activeTab });

  // Prepare depth chart data
  const depthChartData = useMemo(() => {
    if (bids.length === 0 && asks.length === 0) return [];
    return prepareDepthChartData(bids, asks, currentPrice);
  }, [bids, asks, currentPrice]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Market Data</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
              {isConnected ? '🟢 Live' : '🔴 Offline'}
            </Badge>
            {spread > 0 && (
              <Badge variant="outline" className="text-xs">
                Spread: {formatCurrency(spread)}
              </Badge>
            )}
          </div>
        </div>

        {/* Price Summary */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <span className="text-green-500">Bid:</span>{' '}
            {bestBid ? formatCurrency(bestBid) : '—'}
          </span>
          <span className="font-bold text-foreground">
            {formatCurrency(currentPrice)}
          </span>
          <span>
            <span className="text-red-500">Ask:</span>{' '}
            {bestAsk ? formatCurrency(bestAsk) : '—'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ChartTabValue)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="price" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Price History
            </TabsTrigger>
            <TabsTrigger value="depth" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Market Depth
            </TabsTrigger>
          </TabsList>

          <TabsContent value="price" className="h-[300px]">
            <PriceHistoryChart data={priceHistory} />
          </TabsContent>

          <TabsContent value="depth" className="h-[300px]">
            <DepthChart data={depthChartData} currentPrice={currentPrice} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
````

````typescript
/**
 * Order Book Panel Component
 * Displays bids and asks with depth visualization
 */

'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUnifiedSocket } from '@/hooks/useUnifiedSocket';
import { useIsMobile } from '@/hooks/useIsMobile';
import { OrderBookTable } from './OrderBookTable';
import { MobileOrderBookLadder } from './MobileOrderBookLadder';
import { formatCurrency } from '@/lib/format-utils';
import { calculateMaxQuantity } from '@/lib/chart-utils';

interface OrderBookPanelProps {
  assetId: string;
  initialPrice: number;
}

export function OrderBookPanel({ assetId, initialPrice }: OrderBookPanelProps) {
  const isMobile = useIsMobile();
  const { isConnected, bids, asks, currentPrice, spread } = useUnifiedSocket({
    assetId,
    initialPrice,
  });

  // Calculate max quantity for depth bar scaling
  const maxBidQuantity = useMemo(() => calculateMaxQuantity(bids), [bids]);
  const maxAskQuantity = useMemo(() => calculateMaxQuantity(asks), [asks]);
  const maxQuantity = Math.max(maxBidQuantity, maxAskQuantity, 1);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Order Book</CardTitle>
          <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
            {isConnected ? '🟢 Live' : '🔴 Offline'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isMobile ? (
          <MobileOrderBookLadder
            bids={bids}
            asks={asks}
            currentPrice={currentPrice}
            spread={spread}
            maxQuantity={maxQuantity}
          />
        ) : (
          <OrderBookTable
            bids={bids}
            asks={asks}
            currentPrice={currentPrice}
            spread={spread}
            maxQuantity={maxQuantity}
          />
        )}
      </CardContent>
    </Card>
  );
}
````

Now let's delete the old hooks and update the store:

````typescript
/**
 * Zustand store for global Socket.io state
 * Used for landing page and global connection status
 *
 * Note: For asset-specific data, use useUnifiedSocket hook instead
 */

'use client';

import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import {
  initializeSocket,
  disconnectSocket,
  subscribeToAllAssets,
  unsubscribeFromAllAssets,
} from '@/lib/socket';
import { SERVER_EVENTS, AssetPriceUpdatePayload } from '@/lib/socketEvents';

interface GlobalSocketStore {
  socket: Socket | null;
  isConnected: boolean;
  assetPrices: Map<string, number>;
  lastUpdateTime: string | null;

  // Actions
  connect: () => void;
  disconnect: () => void;
  updateAssetPrice: (update: AssetPriceUpdatePayload['data']) => void;
  getAssetPrice: (assetId: string) => number | undefined;
}

export const useGlobalSocketStore = create<GlobalSocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  assetPrices: new Map(),
  lastUpdateTime: null,

  connect: () => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) return;

    const socket = initializeSocket();

    socket.on('connect', () => {
      console.log('🌐 Global socket connected, subscribing to all assets...');
      set({ isConnected: true });
      subscribeToAllAssets(socket);
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on(SERVER_EVENTS.ASSET_PRICE_UPDATE, (payload: AssetPriceUpdatePayload) => {
      get().updateAssetPrice(payload.data);
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      unsubscribeFromAllAssets(socket);
      disconnectSocket();
      set({ socket: null, isConnected: false });
    }
  },

  updateAssetPrice: (update) => {
    set((state) => {
      const newPrices = new Map(state.assetPrices);
      newPrices.set(update.assetId, update.currentPrice);
      return {
        assetPrices: newPrices,
        lastUpdateTime: update.timestamp,
      };
    });
  },

  getAssetPrice: (assetId: string) => {
    return get().assetPrices.get(assetId);
  },
}));

// Backwards compatibility alias
export const useSocketStore = useGlobalSocketStore;
````

Update the hook for the assets list page:

````typescript
/**
 * Custom hook for Socket.io integration on the Assets List page
 * Uses global socket store for all assets price updates
 */

'use client';

import { useEffect } from 'react';
import { useGlobalSocketStore } from '@/stores/socketStore';

/**
 * Hook for global socket connection (assets list page)
 */
export function useGlobalSocket() {
  const { socket, isConnected, connect, disconnect } = useGlobalSocketStore();

  useEffect(() => {
    connect();

    return () => {
      // Don't disconnect on unmount - let other components use the connection
      // disconnect();
    };
  }, [connect]);

  return {
    socket,
    isConnected,
  };
}

/**
 * Hook to get live asset price from global store
 */
export function useAssetPrice(assetId: string, initialPrice: number) {
  const getAssetPrice = useGlobalSocketStore((state) => state.getAssetPrice);
  const livePrice = getAssetPrice(assetId);

  return livePrice ?? initialPrice;
}

/**
 * Hook to get connection status
 */
export function useConnectionStatus() {
  const isConnected = useGlobalSocketStore((state) => state.isConnected);
  const lastUpdateTime = useGlobalSocketStore((state) => state.lastUpdateTime);

  return { isConnected, lastUpdateTime };
}
````

Create the barrel export for hooks:

````typescript
/**
 * Hooks barrel export
 */

// Unified socket hook for asset detail pages
export {
  useUnifiedSocket,
  useOrderBook,
  usePriceHistory,
  useTrading,
  type ChartTabValue,
  type UseUnifiedSocketOptions,
  type UseUnifiedSocketReturn,
  type OrderPlacementResult,
} from './useUnifiedSocket';

// Global socket hooks for assets list page
export {
  useGlobalSocket,
  useAssetPrice,
  useConnectionStatus,
} from './useSocket';

// Utility hooks
export { useIsMobile } from './useIsMobile';
````

---

## Summary

### Files Created/Updated

| File | Action | Description |
|------|--------|-------------|
| `my-app/src/hooks/useUnifiedSocket.tsx` | ✅ Created | Consolidated smart socket hook |
| ChartTabs.tsx | ✅ Updated | Uses new unified hook |
| OrderBookPanel.tsx | ✅ Updated | Uses new unified hook |
| socketStore.tsx | ✅ Updated | Simplified for global use |
| useSocket.tsx | ✅ Updated | For assets list page |
| `my-app/src/hooks/index.ts` | ✅ Created | Barrel export |

### Files to Delete

- useSmartSocket.tsx (replaced by `useUnifiedSocket`)
- useSmartSocketIo.tsx (replaced by `useUnifiedSocket`)
- assetDetailStore.tsx (state now in hook)

### Key Features of `useUnifiedSocket`

1. **RequestAnimationFrame Buffering** - Prevents UI jank with 500ms updates
2. **All Event Types** - Handles `ORDERBOOK_UPDATE`, `ASSET_PRICE_UPDATE`, `TRADE_EXECUTED`, `ORDER_CONFIRMED`
3. **Order Placement** - `placeLimitOrder()` and `placeMarketOrder()` ready for backend integration
4. **Tab-Aware** - Can optimize subscriptions based on active tab
5. **Proper Cleanup** - Cancels RAF, unsubscribes on unmount
6. **Convenience Hooks** - `useOrderBook`, `usePriceHistory`, `useTrading`

### Ready for Future Order/Trade Flow

The hook exposes:
- `placeLimitOrder(params)` - Returns `Promise<OrderPlacementResult>`
- `placeMarketOrder(params)` - Returns `Promise<OrderPlacementResult>`
- `userOrders` - All user orders
- `pendingOrders` - Orders with status 'open'
- `trades` - Executed trades
- `recentTrades` - Last 10 trades