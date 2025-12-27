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
import type { Asset } from '@/types';

interface AssetPriceUpdate {
  assetId: string;
  currentPrice: number;
  timestamp: string;
}

interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  assetPrices: Map<string, number>;

  // Actions
  connect: () => void;
  disconnect: () => void;
  updateAssetPrice: (update: AssetPriceUpdate) => void;
  getAssetPrice: (assetId: string) => number | undefined;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  assetPrices: new Map(),

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

    // Listen for price updates
    socket.on('asset_price_update', (payload: { event: string; data: AssetPriceUpdate }) => {
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

  updateAssetPrice: (update: AssetPriceUpdate) => {
    set((state) => {
      const newPrices = new Map(state.assetPrices);
      newPrices.set(update.assetId, update.currentPrice);
      return { assetPrices: newPrices };
    });
  },

  getAssetPrice: (assetId: string) => {
    return get().assetPrices.get(assetId);
  },
}));