import { Server, Socket } from 'socket.io';
import AssetStore from '../store/AssetStore';
import OrderBookStore from '../store/OrderBookStore';

class WebSocketHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  initialize() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`✅ Client connected: ${socket.id}`);

      // ===== EXISTING ENDPOINTS =====
      socket.on('subscribe_asset', (assetId: string) => {
        if (!assetId || typeof assetId !== 'string') {
          console.warn(`⚠️  Invalid assetId from ${socket.id}`);
          return;
        }
        socket.join(`asset:${assetId}`);
        console.log(`📌 Client ${socket.id} subscribed to asset ${assetId}`);
      });

      socket.on('unsubscribe_asset', (assetId: string) => {
        if (!assetId || typeof assetId !== 'string') {
          return;
        }
        socket.leave(`asset:${assetId}`);
        console.log(`📍 Client ${socket.id} unsubscribed from asset ${assetId}`);
      });

      // ===== NEW ENDPOINTS (Step 2A, 2B, 2C) =====

      // 2A) get_asset_price - Request/Response pattern
      socket.on(
        'get_asset_price',
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

      // 2B) get_orderbook - Request/Response pattern
      socket.on(
        'get_orderbook',
        (assetId: string, callback: (response: any) => void) => {
          if (!assetId || typeof assetId !== 'string') {
            return callback({ error: 'Invalid assetId' });
          }

          const orderBook = OrderBookStore.getOrderBook(assetId);
          callback(orderBook);
        }
      );

      // 2C) subscribe_all_assets - Join landing page room
      socket.on('subscribe_all_assets', () => {
        socket.join('assets:all');
        console.log(`🌐 Client ${socket.id} subscribed to all assets`);
      });

      // 2C) unsubscribe_all_assets - Leave landing page room
      socket.on('unsubscribe_all_assets', () => {
        socket.leave('assets:all');
        console.log(`🌐 Client ${socket.id} unsubscribed from all assets`);
      });

      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });
  }

  emitToAsset(assetId: string, event: string, data: any) {
    this.io.to(`asset:${assetId}`).emit(event, data);
  }

  emitToAllAssets(event: string, data: any) {
    this.io.to('assets:all').emit(event, data);
  }
}

export default WebSocketHandler;