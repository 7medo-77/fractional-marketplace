/**
 * Consolidated Zustand store for Socket.io state management
 * - Single socket instance (via initializeSocket singleton)
 * - Single listener attachment (once)
 * - Ref-counted per-asset subscriptions to avoid premature unsubscribe
 */

'use client';

import { create } from 'zustand';
import type { Socket } from 'socket.io-client';
import {
  initializeSocket,
  disconnectSocket,
  subscribeToAllAssets,
  unsubscribeFromAllAssets,
  subscribeToAsset,
  unsubscribeFromAsset,
} from '@/lib/socket';
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  AssetPriceUpdatePayload,
  OrderbookUpdatePayload,
  OrderConfirmedPayload,
  OrderFilledPayload,
} from '@/lib/socketEvents';
import type { OrderBook } from '@/types';
import { generateMockPriceHistory, type PriceHistoryPoint } from '@/lib/utils/chart-utils';

const EMPTY_PRICE_HISTORY: PriceHistoryPoint[] = [];
if (process.env.NODE_ENV === 'development') Object.freeze(EMPTY_PRICE_HISTORY);

type AssetId = string;

interface SocketStore {
  // Socket / connection
  socket: Socket | null;
  isConnected: boolean;

  // Internal
  listenersAttached: boolean;

  // All-assets price feed
  assetPrices: Map<string, number>;
  lastUpdateTime: string | null;

  // Per-asset detail data
  orderBooksByAssetId: Record<AssetId, OrderBook | undefined>;
  priceHistoryByAssetId: Record<AssetId, PriceHistoryPoint[] | undefined>;

  // Subscription ref-counting (prevents duplicate subscribes/unsubscribes)
  assetSubscriberCounts: Record<AssetId, number | undefined>;

  // Auth-ish context for filtering notifications
  userId: string | null;
  setUserId: (userId: string | null) => void;

  // Notifications (bounded)
  notifications: OrderNotification[];
  clearNotifications: () => void;

  // Actions (connection)
  connect: () => Socket;
  disconnect: () => void;

  // Actions (all-assets feed)
  updateAssetPrice: (update: AssetPriceUpdatePayload['data']) => void;
  getAssetPrice: (assetId: string) => number | undefined;

  // Actions (asset detail feed)
  retainAsset: (assetId: string, initialPrice?: number) => void;
  releaseAsset: (assetId: string) => void;
  getOrderBook: (assetId: string) => OrderBook | undefined;
  getPriceHistory: (assetId: string) => PriceHistoryPoint[];

  // Actions (orders)
  placeOrder: (req: PlaceOrderRequest) => Promise<PlaceOrderAck>;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  listenersAttached: false,

  assetPrices: new Map(),
  lastUpdateTime: null,

  orderBooksByAssetId: {},
  priceHistoryByAssetId: {},
  assetSubscriberCounts: {},

  userId: null,
  setUserId: (userId) => set({ userId }),

  notifications: [],
  clearNotifications: () => set({ notifications: [] }),

  connect: () => {
    const s = initializeSocket();

    if (!get().listenersAttached) {
      s.on('connect', () => {
        set({ isConnected: true });
        subscribeToAllAssets(s);

        const counts = get().assetSubscriberCounts;
        for (const [assetId, count] of Object.entries(counts)) {
          if ((count ?? 0) > 0) subscribeToAsset(s, assetId);
        }
      });

      s.on('disconnect', () => {
        set({ isConnected: false });
      });

      s.on(SERVER_EVENTS.ASSET_PRICE_UPDATE, (payload: AssetPriceUpdatePayload) => {
        get().updateAssetPrice(payload.data);
      });

      s.on(SERVER_EVENTS.ORDER_CONFIRMED, (payload: OrderConfirmedPayload) => {
        const currentUserId = get().userId;
        if (!currentUserId) return;
        if (payload.data.userId !== currentUserId) return;

        set((state) => ({
          notifications: [
            ...state.notifications,
            {
              kind: 'confirmed',
              orderId: payload.data.orderId,
              assetId: payload.data.assetId,
              timestamp: Date.now(),
            },
          ].slice(-100),
        }));
      });

      s.on(SERVER_EVENTS.ORDER_FILLED, (payload: OrderFilledPayload) => {
        const currentUserId = get().userId;
        if (!currentUserId) return;
        if (payload.data.userId !== currentUserId) return;

        set((state) => ({
          notifications: [
            ...state.notifications,
            {
              kind: 'filled',
              orderId: payload.data.orderId,
              assetId: payload.data.assetId,
              side: payload.data.type === 'bid' ? 'buy' : 'sell',
              quantity: payload.data.quantity,
              price: payload.data.price,
              timestamp: Date.now(),
            },
          ].slice(-100),
        }));
      });

      s.on(SERVER_EVENTS.ORDERBOOK_UPDATE, (payload: OrderbookUpdatePayload) => {
        const { assetId } = payload.data;

        // Only process updates for assets someone is currently retaining
        const count = get().assetSubscriberCounts[assetId] ?? 0;
        if (count <= 0) return;

        // IMPORTANT: cap depth arrays to avoid state bloat
        const nextBids = payload.data.bids.slice(0, 50);
        const nextAsks = payload.data.asks.slice(0, 50);

        const orderBook: OrderBook = {
          assetId: payload.data.assetId,
          currentPrice: payload.data.currentPrice,
          spread: payload.data.spread,
          bestBid: payload.data.bestBid,
          bestAsk: payload.data.bestAsk,
          bids: nextBids,
          asks: nextAsks,
          lastUpdated: payload.data.timestamp,
        };

        set((state) => {
          const prevHistory = state.priceHistoryByAssetId[assetId] ?? [];
          const now = Date.now();
          const newPoint: PriceHistoryPoint = {
            time: new Date(now).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            price: payload.data.currentPrice,
            timestamp: now,
          };

          const nextHistory = [...prevHistory, newPoint].slice(-100);

          return {
            orderBooksByAssetId: { ...state.orderBooksByAssetId, [assetId]: orderBook },
            priceHistoryByAssetId: { ...state.priceHistoryByAssetId, [assetId]: nextHistory },
          };
        });
      });

      set({ listenersAttached: true });
    }

    set({ socket: s });
    return s;
  },

  disconnect: () => {
    const s = get().socket;
    if (!s) return;

    // Best-effort cleanup
    try {
      unsubscribeFromAllAssets(s);
      for (const [assetId, count] of Object.entries(get().assetSubscriberCounts)) {
        if ((count ?? 0) > 0) unsubscribeFromAsset(s, assetId);
      }
    } finally {
      disconnectSocket();
      set({
        socket: null,
        isConnected: false,
        listenersAttached: false,
        assetSubscriberCounts: {},
        orderBooksByAssetId: {},
        priceHistoryByAssetId: {},
      });
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

  getAssetPrice: (assetId) => get().assetPrices.get(assetId),

  retainAsset: (assetId, initialPrice = 5000) => {
    const s = get().connect();

    set((state) => {
      const prevCount = state.assetSubscriberCounts[assetId] ?? 0;
      const nextCount = prevCount + 1;

      // Create initial history once (on first retain)
      const nextHistoryByAssetId =
        prevCount === 0
          ? {
              ...state.priceHistoryByAssetId,
              [assetId]: generateMockPriceHistory(initialPrice, 50),
            }
          : state.priceHistoryByAssetId;

      return {
        assetSubscriberCounts: { ...state.assetSubscriberCounts, [assetId]: nextCount },
        priceHistoryByAssetId: nextHistoryByAssetId,
      };
    });

    // Only actually subscribe on transition 0 -> 1
    const countNow = get().assetSubscriberCounts[assetId] ?? 0;
    if (countNow === 1) {
      if (s.connected) {
        subscribeToAsset(s, assetId);
      }
      // If not connected yet, the store's 'connect' handler will subscribe on connect.
    }
  },

  releaseAsset: (assetId) => {
    const s = get().socket;
    if (!s) return;

    const prev = get().assetSubscriberCounts[assetId] ?? 0;
    const next = Math.max(prev - 1, 0);

    set((state) => ({
      assetSubscriberCounts: { ...state.assetSubscriberCounts, [assetId]: next },
    }));

    // Only actually unsubscribe on transition 1 -> 0
    if (prev === 1 && next === 0) {
      unsubscribeFromAsset(s, assetId);

      // Optional: clear cached detail state for that asset to avoid stale display
      set((state) => {
        const { [assetId]: _ob, ...restOB } = state.orderBooksByAssetId;
        const { [assetId]: _ph, ...restPH } = state.priceHistoryByAssetId;
        return { orderBooksByAssetId: restOB, priceHistoryByAssetId: restPH };
      });
    }
  },

  getOrderBook: (assetId) => get().orderBooksByAssetId[assetId],

  // IMPORTANT: do NOT return `?? []` (new array each time)
  getPriceHistory: (assetId) =>
    get().priceHistoryByAssetId[assetId] ?? EMPTY_PRICE_HISTORY,

  placeOrder: async (req) => {
    const s = get().connect();

    if (!s.connected || !get().isConnected) {
      return { ok: false, error: 'Not connected to server' };
    }

    const eventName =
      req.orderType === 'market'
        ? CLIENT_EVENTS.PLACE_MARKET_ORDER
        : CLIENT_EVENTS.PLACE_LIMIT_ORDER;

    const payload =
      req.orderType === 'market'
        ? {
            assetId: req.assetId,
            type: req.type,
            quantity: req.quantity,
            userId: req.userId,
          }
        : {
            assetId: req.assetId,
            type: req.type,
            quantity: req.quantity,
            userId: req.userId,
            price: req.price,
          };

    return await new Promise<PlaceOrderAck>((resolve) => {
      s.emit(eventName, payload, (ack: PlaceOrderAck) => resolve(ack));
    });
  },
}));
