/**
 * WebSocket Handler
 * Manages Socket.io connections and events
 *
 * Following Single Responsibility Principle:
 * - Handles socket connections
 * - Routes events to appropriate services
 * - Emits responses/broadcasts
 */

import { Server, Socket } from 'socket.io';
import AssetStore from '../store/AssetStore';
import OrderBookStore from '../store/OrderBookStore';
import OrderService from '../services/OrderService';
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  ROOMS,
  OrderConfirmedPayload,
  TradeExecutedPayload,
} from './socketEvents';

class WebSocketHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  initialize() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`✅ Client connected: ${socket.id}`);

      // ===== ROOM SUBSCRIPTIONS =====

      socket.on(CLIENT_EVENTS.SUBSCRIBE_ASSET, (assetId: string) => {
        if (!assetId || typeof assetId !== 'string') {
          console.warn(`⚠️  Invalid assetId from ${socket.id}`);
          return;
        }
        socket.join(ROOMS.asset(assetId));
        console.log(`📌 Client ${socket.id} subscribed to asset ${assetId}`);
      });

      socket.on(CLIENT_EVENTS.UNSUBSCRIBE_ASSET, (assetId: string) => {
        if (!assetId || typeof assetId !== 'string') {
          return;
        }
        socket.leave(ROOMS.asset(assetId));
        console.log(`📍 Client ${socket.id} unsubscribed from asset ${assetId}`);
      });

      socket.on(CLIENT_EVENTS.SUBSCRIBE_ALL_ASSETS, () => {
        socket.join(ROOMS.allAssets);
        console.log(`🌐 Client ${socket.id} subscribed to all assets`);
      });

      socket.on(CLIENT_EVENTS.UNSUBSCRIBE_ALL_ASSETS, () => {
        socket.leave(ROOMS.allAssets);
        console.log(`🌐 Client ${socket.id} unsubscribed from all assets`);
      });

      // New: User-specific order subscriptions
      socket.on(CLIENT_EVENTS.SUBSCRIBE_USER_ORDERS, (userId: string) => {
        if (!userId || typeof userId !== 'string') {
          console.warn(`⚠️  Invalid userId from ${socket.id}`);
          return;
        }
        socket.join(ROOMS.user(userId));
        console.log(`👤 Client ${socket.id} subscribed to user ${userId} orders`);
      });

      socket.on(CLIENT_EVENTS.UNSUBSCRIBE_USER_ORDERS, (userId: string) => {
        if (!userId || typeof userId !== 'string') {
          return;
        }
        socket.leave(ROOMS.user(userId));
        console.log(`👤 Client ${socket.id} unsubscribed from user ${userId} orders`);
      });

      // ===== REQUEST/RESPONSE EVENTS =====

      socket.on(
        CLIENT_EVENTS.GET_ASSET_PRICE,
        (assetId: string, callback: (response: any) => void) => {
          if (!assetId || typeof assetId !== 'string') {
            return callback({ error: 'Invalid assetId' });
          }

          const asset = AssetStore.getAsset(assetId);
          if (!asset) {
            return callback({ error: 'Asset not found' });
          }

          callback({
            assetId: asset.id,
            currentPrice: asset.currentPrice,
            priceHistory: asset.priceHistory,
          });
        }
      );

      socket.on(
        CLIENT_EVENTS.GET_ORDERBOOK,
        (assetId: string, callback: (response: any) => void) => {
          if (!assetId || typeof assetId !== 'string') {
            return callback({ error: 'Invalid assetId' });
          }

          const orderBook = OrderBookStore.getOrderBook(assetId);
          callback(orderBook);
        }
      );

      // ===== ORDER PLACEMENT (POST-like) =====

      socket.on(
        CLIENT_EVENTS.PLACE_LIMIT_ORDER,
        async (
          params: {
            assetId: string;
            type: 'buy' | 'sell';
            quantity: number;
            price: number;
            userId: string;
          },
          callback: (response: any) => void
        ) => {
          // Validation
          if (!params.assetId || !params.type || !params.quantity || !params.price || !params.userId) {
            return callback({ ok: false, error: 'Missing required fields' });
          }

          if (params.quantity <= 0) {
            return callback({ ok: false, error: 'Quantity must be positive' });
          }

          if (params.price <= 0) {
            return callback({ ok: false, error: 'Price must be positive' });
          }

          if (!['buy', 'sell'].includes(params.type)) {
            return callback({ ok: false, error: 'Type must be buy or sell' });
          }

          const asset = AssetStore.getAsset(params.assetId);
          if (!asset) {
            return callback({ ok: false, error: 'Asset not found' });
          }

          try {
            const order = await OrderService.placeLimitOrder({
              assetId: params.assetId,
              type: params.type,
              quantity: params.quantity,
              price: params.price,
              userId: params.userId,
            });

            // Ack response
            callback({ ok: true, order });

            // Emit order_confirmed to the requesting socket AND user room
            const orderConfirmedPayload: OrderConfirmedPayload = {
              event: SERVER_EVENTS.ORDER_CONFIRMED,
              data: {
                orderId: order.id,
                assetId: order.assetId,
                userId: order.userId,
                type: order.type,
                orderType: order.orderType,
                quantity: order.quantity,
                price: order.price,
                status: order.status,
                timestamp: order.createdAt,
              },
            };

            // Emit to the socket that placed the order
            socket.emit(SERVER_EVENTS.ORDER_CONFIRMED, orderConfirmedPayload);

            // Also emit to user's room (for other tabs/devices)
            this.io.to(ROOMS.user(params.userId)).emit(SERVER_EVENTS.ORDER_CONFIRMED, orderConfirmedPayload);

            console.log(`✅ Limit order placed: ${order.id} (${params.type} ${params.quantity} @ ${params.price})`);
          } catch (error) {
            callback({ ok: false, error: (error as Error).message });
          }
        }
      );

      socket.on(
        CLIENT_EVENTS.PLACE_MARKET_ORDER,
        async (
          params: {
            assetId: string;
            type: 'buy' | 'sell';
            quantity: number;
            userId: string;
          },
          callback: (response: any) => void
        ) => {
          // Validation
          if (!params.assetId || !params.type || !params.quantity || !params.userId) {
            return callback({ ok: false, error: 'Missing required fields' });
          }

          if (params.quantity <= 0) {
            return callback({ ok: false, error: 'Quantity must be positive' });
          }

          if (!['buy', 'sell'].includes(params.type)) {
            return callback({ ok: false, error: 'Type must be buy or sell' });
          }

          const asset = AssetStore.getAsset(params.assetId);
          if (!asset) {
            return callback({ ok: false, error: 'Asset not found' });
          }

          try {
            const result = await OrderService.placeMarketOrder({
              assetId: params.assetId,
              type: params.type,
              quantity: params.quantity,
              userId: params.userId,
            });

            // Ack response
            callback({
              ok: true,
              order: result.order,
              totalCost: result.totalCost,
            });

            // Emit order_confirmed
            const orderConfirmedPayload: OrderConfirmedPayload = {
              event: SERVER_EVENTS.ORDER_CONFIRMED,
              data: {
                orderId: result.order.id,
                assetId: result.order.assetId,
                userId: result.order.userId,
                type: result.order.type,
                orderType: result.order.orderType,
                quantity: result.order.quantity,
                status: result.order.status,
                totalCost: result.totalCost,
                timestamp: result.order.createdAt,
              },
            };

            socket.emit(SERVER_EVENTS.ORDER_CONFIRMED, orderConfirmedPayload);
            this.io.to(ROOMS.user(params.userId)).emit(SERVER_EVENTS.ORDER_CONFIRMED, orderConfirmedPayload);

            // Emit trade_executed for each trade
            result.trades.forEach((trade) => {
              const tradePayload: TradeExecutedPayload = {
                event: SERVER_EVENTS.TRADE_EXECUTED,
                data: {
                  tradeId: trade.id,
                  assetId: trade.assetId,
                  buyerId: trade.buyerId,
                  sellerId: trade.sellerId,
                  quantity: trade.quantity,
                  price: trade.price,
                  timestamp: trade.executedAt,
                },
              };

              // Emit to asset room
              this.io.to(ROOMS.asset(trade.assetId)).emit(SERVER_EVENTS.TRADE_EXECUTED, tradePayload);
            });

            console.log(`✅ Market order executed: ${result.order.id} (${params.type} ${params.quantity}) - Total: $${result.totalCost}`);
          } catch (error) {
            callback({ ok: false, error: (error as Error).message });
          }
        }
      );

      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });
  }

  // ===== BROADCAST METHODS =====

  emitToAsset(assetId: string, event: string, data: any) {
    this.io.to(ROOMS.asset(assetId)).emit(event, data);
  }

  emitToAllAssets(event: string, data: any) {
    this.io.to(ROOMS.allAssets).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.io.to(ROOMS.user(userId)).emit(event, data);
  }

  /**
   * Emit order filled event to user
   * Called by MarketDataService when a limit order is filled
   */
  emitOrderFilled(userId: string, payload: any) {
    this.io.to(ROOMS.user(userId)).emit(SERVER_EVENTS.ORDER_FILLED, payload);
  }

  /**
   * Get the Socket.io server instance
   */
  getIO(): Server {
    return this.io;
  }
}

export default WebSocketHandler;