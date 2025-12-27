import { Server } from 'socket.io';
import AssetStore from '../store/AssetStore';
import OrderBookStore from '../store/OrderBookStore';

class MarketDataService {
  private io: Server;
  private interval: NodeJS.Timeout | null = null;

  constructor(io: Server) {
    this.io = io;
  }

  start() {
    this.interval = setInterval(() => {
      this.generateMockOrders();
      this.broadcastOrderBooks();
    }, 500);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private generateMockOrders() {
    // TODO: Implement mock order generation
    // Generate 1-3 random limit orders per asset within ±5% of current price
  }

  private broadcastOrderBooks() {
    const assets = AssetStore.getAllAssets();

    assets.forEach((asset) => {
      const orderBook = OrderBookStore.getOrderBook(asset.id);

      this.io.emit('orderbook_update', {
        event: 'orderbook_update',
        data: {
          assetId: asset.id,
          bids: orderBook.bids,
          asks: orderBook.asks,
          timestamp: orderBook.lastUpdated,
        },
      });
    });
  }
}

export default MarketDataService;