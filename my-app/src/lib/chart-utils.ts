/**
 * Zustand store for Asset Detail page
 * Manages order book and price history via Socket.io
 */

'use client';

import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import {
  initializeSocket,
  disconnectSocket,
  subscribeToAsset,
  unsubscribeFromAsset,
} from '@/lib/socket';
import { SERVER_EVENTS, OrderbookUpdatePayload } from '@/lib/socketEvents';
import type { OrderBook, OrderBookEntry } from '@/types';
import { generateMockPriceHistory, PriceHistoryPoint } from '@/lib/chart-utils';

interface AssetDetailStore {
  // Connection
  socket: Socket | null;
  isConnected: boolean;
  subscribedAssetId: string | null;

  // Order Book Data
  orderBook: OrderBook | null;

  // Price History
  priceHistory: PriceHistoryPoint[];

  // Actions
  subscribeToAsset: (assetId: string, initialPrice?: number) => void;
  unsubscribeFromAsset: () => void;
  updateOrderBook: (data: OrderbookUpdatePayload['data']) => void;
  addPricePoint: (price: number) => void;
}

export const useAssetDetailStore = create<AssetDetailStore>((set, get) => ({
  socket: null,
  isConnected: false,
  subscribedAssetId: null,
  orderBook: null,
  priceHistory: [],

  subscribeToAsset: (assetId: string, initialPrice = 5000) => {
    const { socket: existingSocket, subscribedAssetId } = get();

    // Unsubscribe from previous asset if different
    if (subscribedAssetId && subscribedAssetId !== assetId) {
      get().unsubscribeFromAsset();
    }

    // Initialize socket if needed
    const socket = existingSocket || initializeSocket();

    // Generate initial price history
    const initialHistory = generateMockPriceHistory(initialPrice, 50);

    socket.on('connect', () => {
      console.log(`🔌 Asset detail connected, subscribing to ${assetId}`);
      set({ isConnected: true });
      subscribeToAsset(socket, assetId);
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    // Listen for order book updates
    socket.on(SERVER_EVENTS.ORDERBOOK_UPDATE, (payload: OrderbookUpdatePayload) => {
      if (payload.data.assetId === assetId) {
        get().updateOrderBook(payload.data);
      }
    });

    // Subscribe if already connected
    if (socket.connected) {
      subscribeToAsset(socket, assetId);
    }

    set({
      socket,
      subscribedAssetId: assetId,
      priceHistory: initialHistory,
    });
  },

  unsubscribeFromAsset: () => {
    const { socket, subscribedAssetId } = get();

    if (socket && subscribedAssetId) {
      unsubscribeFromAsset(socket, subscribedAssetId);
      socket.off(SERVER_EVENTS.ORDERBOOK_UPDATE);
    }

    set({
      subscribedAssetId: null,
      orderBook: null,
    });
  },

  updateOrderBook: (data) => {
    const orderBook: OrderBook = {
      assetId: data.assetId,
      currentPrice: data.currentPrice,
      spread: data.spread,
      bestBid: data.bestBid,
      bestAsk: data.bestAsk,
      bids: data.bids,
      asks: data.asks,
      lastUpdated: data.timestamp,
    };

    // Add new price point to history
    get().addPricePoint(data.currentPrice);

    set({ orderBook });
  },

  addPricePoint: (price: number) => {
    set((state) => {
      const now = Date.now();
      const newPoint: PriceHistoryPoint = {
        time: new Date(now).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        price,
        timestamp: now,
      };

      // Keep last 100 points
      const updatedHistory = [...state.priceHistory, newPoint].slice(-100);

      return { priceHistory: updatedHistory };
    });
  },
}));