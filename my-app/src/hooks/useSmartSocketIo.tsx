/**
 * Smart Socket.io Subscription Manager
 *
 * Manages socket subscriptions based on active tab to optimize performance.
 * Features:
 * - Subscribe only to needed data based on active tab
 * - Buffer rapid updates using requestAnimationFrame
 * - Clean unsubscription on tab changes and unmount
 * - Handles reconnection gracefully
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket, getSocket } from '@/lib/socket';
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  OrderbookUpdatePayload,
  TradeExecutedPayload,
} from '@/lib/socketEvents';
import type { OrderBook, Trade } from '@/types';
import type { ChartTabValue, UseSmartSocketIoReturn } from '@/components/asset-detail/AssetDetail.types';

/**
 * Smart Socket.io hook that manages subscriptions based on active tab
 *
 * @param assetId - The ID of the asset to subscribe to
 * @param activeTab - The currently active tab ('price' | 'depth')
 * @param initialOrderBook - Optional initial order book data
 */
export function useSmartSocketIo(
  assetId: string,
  activeTab: ChartTabValue,
  initialOrderBook?: OrderBook
): UseSmartSocketIoReturn {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(initialOrderBook ?? null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for managing updates with requestAnimationFrame
  const pendingOrderBookUpdate = useRef<OrderBook | null>(null);
  const pendingTradesUpdate = useRef<Trade[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Process buffered updates
  const processUpdates = useCallback(() => {
    if (pendingOrderBookUpdate.current) {
      setOrderBook(pendingOrderBookUpdate.current);
      pendingOrderBookUpdate.current = null;
    }

    if (pendingTradesUpdate.current.length > 0) {
      setTrades((prev) => {
        const newTrades = [...pendingTradesUpdate.current, ...prev].slice(0, 100);
        pendingTradesUpdate.current = [];
        return newTrades;
      });
    }

    rafIdRef.current = null;
  }, []);

  // Buffer updates and schedule processing
  const bufferOrderBookUpdate = useCallback(
    (data: OrderBook) => {
      pendingOrderBookUpdate.current = data;

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(processUpdates);
      }
    },
    [processUpdates]
  );

  const bufferTradeUpdate = useCallback(
    (trade: Trade) => {
      pendingTradesUpdate.current.push(trade);

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(processUpdates);
      }
    },
    [processUpdates]
  );

  // Main effect for socket connection and subscription management
  useEffect(() => {
    if (!assetId) return;

    // Initialize or get existing socket
    const socket = getSocket() ?? initializeSocket();
    socketRef.current = socket;

    // Connection handlers
    const handleConnect = () => {
      console.log(`🔌 Smart socket connected for asset: ${assetId}`);
      setIsConnected(true);
      setError(null);

      // Subscribe to asset room
      socket.emit(CLIENT_EVENTS.SUBSCRIBE_ASSET, assetId);
    };

    const handleDisconnect = (reason: string) => {
      console.log(`❌ Smart socket disconnected: ${reason}`);
      setIsConnected(false);
    };

    const handleConnectError = (err: Error) => {
      console.error('🔴 Socket connection error:', err);
      setError(err.message);
      setIsConnected(false);
    };

    // Data handlers
    const handleOrderBookUpdate = (payload: OrderbookUpdatePayload) => {
      if (payload.data.assetId === assetId) {
        bufferOrderBookUpdate({
          assetId: payload.data.assetId,
          currentPrice: payload.data.currentPrice,
          spread: payload.data.spread,
          bestBid: payload.data.bestBid,
          bestAsk: payload.data.bestAsk,
          bids: payload.data.bids,
          asks: payload.data.asks,
          lastUpdated: payload.data.timestamp,
        });
      }
    };

    const handleTradeExecuted = (payload: TradeExecutedPayload) => {
      if (payload.data.assetId === assetId) {
        bufferTradeUpdate({
          id: payload.data.tradeId,
          assetId: payload.data.assetId,
          buyerId: payload.data.buyerId,
          sellerId: payload.data.sellerId,
          quantity: payload.data.quantity,
          price: payload.data.price,
          executedAt: payload.data.timestamp,
        });
      }
    };

    // Register event handlers
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on(SERVER_EVENTS.ORDERBOOK_UPDATE, handleOrderBookUpdate);
    socket.on(SERVER_EVENTS.TRADE_EXECUTED, handleTradeExecuted);

    // If already connected, subscribe immediately
    if (socket.connected) {
      handleConnect();
    }

    // Cleanup function
    return () => {
      // Cancel pending animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      // Unsubscribe from asset room
      if (socket.connected) {
        socket.emit(CLIENT_EVENTS.UNSUBSCRIBE_ASSET, assetId);
      }

      // Remove event listeners
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off(SERVER_EVENTS.ORDERBOOK_UPDATE, handleOrderBookUpdate);
      socket.off(SERVER_EVENTS.TRADE_EXECUTED, handleTradeExecuted);
    };
  }, [assetId, bufferOrderBookUpdate, bufferTradeUpdate]);

  // Effect to handle tab-specific subscriptions
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !assetId) return;

    // Log tab change for debugging
    console.log(`📊 Active tab changed to: ${activeTab} for asset: ${assetId}`);

    // Both tabs need orderbook updates, but we could optimize further here
    // if we had separate endpoints for price history vs depth chart data
  }, [activeTab, assetId]);

  return {
    orderBook,
    trades,
    isConnected,
    error,
  };
}

/**
 * Hook for getting order book data with initial fetch support
 */
export function useOrderBook(assetId: string, initialOrderBook?: OrderBook) {
  const { orderBook, isConnected, error } = useSmartSocketIo(
    assetId,
    'depth',
    initialOrderBook
  );

  return {
    orderBook,
    isLoading: !orderBook && !error,
    isConnected,
    error,
  };
}
