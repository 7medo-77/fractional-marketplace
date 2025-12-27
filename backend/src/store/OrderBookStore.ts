import { OrderBook } from '../models/OrderBook';

class OrderBookStore {
  private orderBooks: Map<string, OrderBook> = new Map();

  getOrderBook(assetId: string): OrderBook {
    if (!this.orderBooks.has(assetId)) {
      this.orderBooks.set(assetId, {
        assetId,
        currentPrice: 0,
        spread: 0,
        bestBid: undefined,
        bestAsk: undefined,
        bids: [],
        asks: [],
        lastUpdated: new Date().toISOString(),
      });
    }
    return this.orderBooks.get(assetId)!;
  }

  updateOrderBook(assetId: string, orderBook: OrderBook) {
    this.orderBooks.set(assetId, {
      ...orderBook,
      lastUpdated: new Date().toISOString(),
    });
  }

  getAllOrderBooks(): OrderBook[] {
    return Array.from(this.orderBooks.values());
  }
}

export default new OrderBookStore();