/**
 * Zustand store for Socket.io state management
 * Centralizes WebSocket connection and price updates
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
import { SERVER_EVENTS, AssetPriceUpdatePayload } from '../lib/socketEvents';

interface SocketStore {
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

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  assetPrices: new Map(),
  lastUpdateTime: null,

  connect: () => {
    const socket = initializeSocket();

    // Setup event listeners
    socket.on('connect', () => {
      console.log('Socket connected, subscribing to all assets...');
      set({ isConnected: true });
      subscribeToAllAssets(socket);
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    // Listen for price updates using shared event name
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