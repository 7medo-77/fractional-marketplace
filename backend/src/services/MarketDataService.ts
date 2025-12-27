import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import AssetStore from '../store/AssetStore';
import OrderBookStore from '../store/OrderBookStore';
import { Order } from '../models/Order';
import { OrderBookEntry } from '../models/OrderBook';

interface InternalOrder {
  id: string;
  assetId: string;
  type: 'bid' | 'ask';
  price: number;
  quantity: number;
  createdAt: string;
}

class MarketDataService {
  private io: Server;
  private interval: NodeJS.Timeout | null = null;

  // Separate order storage per asset - NEVER mix assets
  private ordersByAsset: Map<string, InternalOrder[]> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.initializeOrderBooks();
  }

  /**
   * Initialize empty order arrays for each asset
   */
  private initializeOrderBooks() {
    const assets = AssetStore.getAllAssets();
    assets.forEach((asset) => {
      this.ordersByAsset.set(asset.id, []);
    });
  }

  /**
   * Start the market data generator - updates every 500ms
   */
  start() {
    // Generate initial orders for each asset
    this.generateInitialOrders();

    this.interval = setInterval(() => {
      this.generateMockOrders();
      this.rebuildAndBroadcastOrderBooks();
    }, 500);

    console.log('📈 MarketDataService started - updating every 500ms');
  }

  /**
   * Stop the market data generator
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('📉 MarketDataService stopped');
    }
  }

  /**
   * Generate initial orders to populate the order book
   */
  private generateInitialOrders() {
    const assets = AssetStore.getAllAssets();

    assets.forEach((asset) => {
      // Generate 5-10 initial bids and asks per asset
      const initialCount = this.randomInt(5, 10);

      for (let i = 0; i < initialCount; i++) {
        this.addNewBid(asset.id, asset.currentPrice);
        this.addNewAsk(asset.id, asset.currentPrice);
      }
    });
  }

  /**
   * Generate mock orders for all assets
   * - 70% chance to add new orders
   * - 30% chance to remove existing orders
   */
  private generateMockOrders() {
    const assets = AssetStore.getAllAssets();

    assets.forEach((asset) => {
      // Generate 1-3 order actions per asset per tick
      const actionCount = this.randomInt(1, 3);

      for (let i = 0; i < actionCount; i++) {
        // Randomly decide bid or ask
        const isBid = Math.random() < 0.5;

        // 70% add, 30% remove
        const shouldAdd = Math.random() < 0.7;

        if (shouldAdd) {
          if (isBid) {
            this.addNewBid(asset.id, asset.currentPrice);
          } else {
            this.addNewAsk(asset.id, asset.currentPrice);
          }
        } else {
          if (isBid) {
            this.removeRandomBid(asset.id);
          } else {
            this.removeRandomAsk(asset.id);
          }
        }
      }
    });
  }

  /**
   * Add a new BID (buy limit order)
   * Price range: currentPrice × (0.85 to 0.95) [5-15% below current]
   */
  private addNewBid(assetId: string, currentPrice: number) {
    const orders = this.ordersByAsset.get(assetId);
    if (!orders) return;

    // Price: 85% to 95% of current price (5-15% below)
    const priceMultiplier = 0.85 + Math.random() * 0.1; // 0.85 to 0.95
    const price = this.roundToTwo(currentPrice * priceMultiplier);

    const order: InternalOrder = {
      id: uuidv4(),
      assetId,
      type: 'bid',
      price,
      quantity: this.randomInt(1, 50),
      createdAt: new Date().toISOString(),
    };

    orders.push(order);
  }

  /**
   * Add a new ASK (sell limit order)
   * Price range: currentPrice × (1.05 to 1.15) [5-15% above current]
   */
  private addNewAsk(assetId: string, currentPrice: number) {
    const orders = this.ordersByAsset.get(assetId);
    if (!orders) return;

    // Price: 105% to 115% of current price (5-15% above)
    const priceMultiplier = 1.05 + Math.random() * 0.1; // 1.05 to 1.15
    const price = this.roundToTwo(currentPrice * priceMultiplier);

    const order: InternalOrder = {
      id: uuidv4(),
      assetId,
      type: 'ask',
      price,
      quantity: this.randomInt(1, 50),
      createdAt: new Date().toISOString(),
    };

    orders.push(order);
  }

  /**
   * Remove a random existing bid for an asset
   */
  private removeRandomBid(assetId: string) {
    const orders = this.ordersByAsset.get(assetId);
    if (!orders) return;

    const bidIndices = orders
      .map((order, index) => (order.type === 'bid' ? index : -1))
      .filter((index) => index !== -1);

    if (bidIndices.length > 0) {
      const randomIndex = bidIndices[this.randomInt(0, bidIndices.length - 1)];
      orders.splice(randomIndex, 1);
    }
  }

  /**
   * Remove a random existing ask for an asset
   */
  private removeRandomAsk(assetId: string) {
    const orders = this.ordersByAsset.get(assetId);
    if (!orders) return;

    const askIndices = orders
      .map((order, index) => (order.type === 'ask' ? index : -1))
      .filter((index) => index !== -1);

    if (askIndices.length > 0) {
      const randomIndex = askIndices[this.randomInt(0, askIndices.length - 1)];
      orders.splice(randomIndex, 1);
    }
  }

  /**
   * Rebuild order books from raw orders and broadcast via Socket.io
   */
  private rebuildAndBroadcastOrderBooks() {
    const assets = AssetStore.getAllAssets();

    assets.forEach((asset) => {
      const orders = this.ordersByAsset.get(asset.id) || [];

      // Separate bids and asks
      const bids = orders.filter((o) => o.type === 'bid');
      const asks = orders.filter((o) => o.type === 'ask');

      // Aggregate by price level
      const aggregatedBids = this.aggregateOrders(bids);
      const aggregatedAsks = this.aggregateOrders(asks);

      // Sort bids: HIGHEST to LOWEST price
      aggregatedBids.sort((a, b) => b.price - a.price);

      // Sort asks: LOWEST to HIGHEST price
      aggregatedAsks.sort((a, b) => a.price - b.price);

      // Update the order book store
      OrderBookStore.updateOrderBook(asset.id, {
        assetId: asset.id,
        bids: aggregatedBids,
        asks: aggregatedAsks,
        lastUpdated: new Date().toISOString(),
      });

      // Broadcast to all connected clients
      // Format matches api_spec.md exactly
      this.io.emit('orderbook_update', {
        event: 'orderbook_update',
        data: {
          assetId: asset.id,
          bids: aggregatedBids.map((b) => ({
            price: b.price,
            quantity: b.quantity,
            total: b.total,
          })),
          asks: aggregatedAsks.map((a) => ({
            price: a.price,
            quantity: a.quantity,
            total: a.total,
          })),
          timestamp: new Date().toISOString(),
        },
      });
    });
  }

  /**
   * Aggregate orders by price level
   * Formula: Total = Price × (Sum of all quantities at that price)
   */
  private aggregateOrders(orders: InternalOrder[]): OrderBookEntry[] {
    const priceMap = new Map<
      number,
      { quantity: number; orderIds: string[] }
    >();

    orders.forEach((order) => {
      const existing = priceMap.get(order.price);
      if (existing) {
        existing.quantity += order.quantity;
        existing.orderIds.push(order.id);
      } else {
        priceMap.set(order.price, {
          quantity: order.quantity,
          orderIds: [order.id],
        });
      }
    });

    const aggregated: OrderBookEntry[] = [];

    priceMap.forEach((value, price) => {
      // EXACT formula: Total = Price × Quantity (rounded to 2 decimals)
      const total = this.roundToTwo(price * value.quantity);

      aggregated.push({
        price,
        quantity: value.quantity,
        total,
        orderIds: value.orderIds,
      });
    });

    return aggregated;
  }

  /**
   * Generate a random integer between min and max (inclusive)
   */
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Round a number to 2 decimal places for currency
   */
  private roundToTwo(num: number): number {
    return Math.round(num * 100) / 100;
  }

  /**
   * Get orders for a specific asset (for external use)
   */
  getOrdersForAsset(assetId: string): InternalOrder[] {
    return this.ordersByAsset.get(assetId) || [];
  }
}

export default MarketDataService;