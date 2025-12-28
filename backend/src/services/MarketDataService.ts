import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import AssetStore from '../store/AssetStore';
import OrderBookStore from '../store/OrderBookStore';
import OrderStore from '../store/OrderStore';
import OrderService from './OrderService';
import { OrderBookEntry } from '../models/OrderBook';
import {
  SERVER_EVENTS,
  OrderFilledPayload,
  TradeExecutedPayload,
} from '../handlers/socketEvents';

interface InternalOrder {
  id: string;
  assetId: string;
  type: 'bid' | 'ask';
  price: number;
  quantity: number;
  createdAt: string;
}

/**
 * Configuration for price drift behavior
 */
const DRIFT_CONFIG = {
  /** Maximum price change per tick as a percentage (0.5% = 0.005) */
  MAX_DRIFT_PERCENT: 0.005,
  /** Smoothing factor to prevent wild swings (0-1, lower = smoother) */
  DRIFT_SENSITIVITY: 0.3,
};

/**
 * Configuration for limit order fill simulation
 */
const LIMIT_FILL_CONFIG = {
  /** Probability of filling a limit order per tick (0.1% = 0.001) */
  // FILL_PROBABILITY: 0.001,
  FILL_PROBABILITY: 0.05,
  /** Maximum orders to check per tick per asset */
  MAX_ORDERS_PER_TICK: 10,
};

class MarketDataService {
  private io: Server;
  private interval: NodeJS.Timeout | null = null;
  private tickCount: number = 0;

  // Separate order storage per asset - NEVER mix assets
  private ordersByAsset: Map<string, InternalOrder[]> = new Map();

  // Track which assets had price changes this tick
  private priceChangesThisTick: Set<string> = new Set();

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
      this.tickCount++;
      this.priceChangesThisTick.clear();

      const startTime = Date.now();

      this.generateMockOrders();
      this.applyPriceDrift();
      this.simulateLimitOrderFills(); // New: simulate fills
      this.rebuildAndBroadcastOrderBooks();

      const elapsed = Date.now() - startTime;
      console.log(`📊 Tick #${this.tickCount} completed in ${elapsed}ms`);
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

    console.log('✅ Initial order books populated');
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
   * Apply price drift based on order book imbalance
   *
   * Formula: I = (Qbid - Qask) / (Qbid + Qask)
   * Where:
   *   - I is the imbalance ratio (-1 to +1)
   *   - Qbid is total bid quantity
   *   - Qask is total ask quantity
   *
   * Price drift: Δp = currentPrice × I × MAX_DRIFT_PERCENT × DRIFT_SENSITIVITY
   *
   * STEP 3: After updating price, emit asset_price_update
   */
  private applyPriceDrift() {
    const assets = AssetStore.getAllAssets();

    // STEP 1A: Calculate and update all prices in the store
    assets.forEach((asset) => {
      const orders = this.ordersByAsset.get(asset.id) || [];

      // Calculate total quantities
      const totalBidQuantity = orders
        .filter((o) => o.type === 'bid')
        .reduce((sum, o) => sum + o.quantity, 0);

      const totalAskQuantity = orders
        .filter((o) => o.type === 'ask')
        .reduce((sum, o) => sum + o.quantity, 0);

      const totalQuantity = totalBidQuantity + totalAskQuantity;

      // Avoid division by zero
      if (totalQuantity === 0) return;

      // Calculate imbalance: I = (Qbid - Qask) / (Qbid + Qask)
      // Range: -1 (all asks) to +1 (all bids)
      const imbalance = (totalBidQuantity - totalAskQuantity) / totalQuantity;

      // Calculate price drift
      const driftAmount =
        asset.currentPrice *
        imbalance *
        DRIFT_CONFIG.MAX_DRIFT_PERCENT *
        DRIFT_CONFIG.DRIFT_SENSITIVITY;

      const newPrice = this.roundToTwo(asset.currentPrice + driftAmount);

      // Update price in store if changed
      if (newPrice > 0 && newPrice !== asset.currentPrice) {
        AssetStore.updateAssetPrice(asset.id, newPrice);
        this.priceChangesThisTick.add(asset.id);
      }
    });

    // STEP 1B: Emit all price updates AFTER the loop
    if (this.priceChangesThisTick.size > 0) {
      const timestamp = new Date().toISOString();

      this.priceChangesThisTick.forEach((assetId) => {
        const asset = AssetStore.getAsset(assetId);
        if (!asset) return;

        const priceUpdatePayload = {
          event: 'asset_price_update',
          data: {
            assetId: asset.id,
            currentPrice: asset.currentPrice,
            timestamp,
          },
        };

        // Emit to specific asset room (for detail pages)
        this.io.to(`asset:${assetId}`).emit('asset_price_update', priceUpdatePayload);

        // Emit to landing page room (for all assets overview)
        this.io.to('assets:all').emit('asset_price_update', priceUpdatePayload);
      });
    }
  }

  /**
   * Simulate limit order fills with 0.1% probability per tick
   * For each asset, checks open limit orders and randomly fills them
   */
  private simulateLimitOrderFills() {
    const assets = AssetStore.getAllAssets();
    const timestamp = new Date().toISOString();

    assets.forEach((asset) => {
      // Get open limit orders for this asset
      const openOrders = OrderStore.getOpenLimitOrdersByAsset(asset.id);

      if (openOrders.length === 0) return;

      // Limit how many orders we check per tick
      const ordersToCheck = openOrders.slice(0, LIMIT_FILL_CONFIG.MAX_ORDERS_PER_TICK);

      ordersToCheck.forEach((order) => {
        // 0.1% chance to fill per tick
        if (Math.random() < LIMIT_FILL_CONFIG.FILL_PROBABILITY) {
          // Fill the order
          const result = OrderService.fillLimitOrder(order.id);

          if (result) {
            const { order: filledOrder, trade } = result;

            console.log(`🎯 Limit order filled by simulation: ${filledOrder.id}`);

            // Emit ORDER_FILLED to user's room
            const orderFilledPayload: OrderFilledPayload = {
              event: 'order_filled',
              data: {
                orderId: filledOrder.id,
                assetId: filledOrder.assetId,
                userId: filledOrder.userId,
                type: filledOrder.type,
                orderType: 'limit',
                quantity: filledOrder.quantity,
                price: filledOrder.price!,
                status: 'filled',
                filledAt: filledOrder.filledAt!,
                tradeId: trade.id,
                timestamp,
              },
            };

            this.io.to(`user:${filledOrder.userId}`).emit(SERVER_EVENTS.ORDER_FILLED, orderFilledPayload);

            // Also emit to asset room for other watchers
            this.io.to(`asset:${filledOrder.assetId}`).emit(SERVER_EVENTS.ORDER_FILLED, orderFilledPayload);

            // Emit TRADE_EXECUTED
            const tradePayload: TradeExecutedPayload = {
              event: 'trade_executed',
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

            this.io.to(`asset:${trade.assetId}`).emit(SERVER_EVENTS.TRADE_EXECUTED, tradePayload);
          }
        }
      });
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
    const priceMultiplier = 0.85 + Math.random() * 0.1;
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
    const priceMultiplier = 1.05 + Math.random() * 0.1;
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
   * compute first, emit AFTER the loop
   *
   * Computes all data needed for depth chart on backend:
   * - Aggregated price levels with quantities and totals
   * - Best bid/ask prices
   * - Spread calculation
   * - Current (drifted) price
   */
  private rebuildAndBroadcastOrderBooks() {
    const assets = AssetStore.getAllAssets();
    const timestamp = new Date().toISOString();

    // STEP 1A: Compute and update all order books in the store
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

      // Calculate best bid/ask and spread
      const bestBid = aggregatedBids.length > 0 ? aggregatedBids[0].price : undefined;
      const bestAsk = aggregatedAsks.length > 0 ? aggregatedAsks[0].price : undefined;

      // Spread = bestAsk - bestBid (only if both exist)
      const spread =
        bestBid !== undefined && bestAsk !== undefined
          ? this.roundToTwo(bestAsk - bestBid)
          : 0;

      // Get current price from asset (includes drift)
      const currentPrice = asset.currentPrice;

      // Update the order book store with all computed fields
      OrderBookStore.updateOrderBook(asset.id, {
        assetId: asset.id,
        currentPrice,
        spread,
        bestBid,
        bestAsk,
        bids: aggregatedBids,
        asks: aggregatedAsks,
        lastUpdated: timestamp,
      });
    });

    // STEP 1B: Emit all order book updates AFTER the loop (read from store)
    const allOrderBooks = OrderBookStore.getAllOrderBooks();

    allOrderBooks.forEach((orderBook) => {
      this.io.to(`asset:${orderBook.assetId}`).emit('orderbook_update', {
        event: 'orderbook_update',
        data: {
          assetId: orderBook.assetId,
          currentPrice: orderBook.currentPrice,
          spread: orderBook.spread,
          bestBid: orderBook.bestBid,
          bestAsk: orderBook.bestAsk,
          bids: orderBook.bids.map((b) => ({
            price: b.price,
            quantity: b.quantity,
            total: b.total,
          })).slice(0, 50), // Limit to top 50 levels
          asks: orderBook.asks.map((a) => ({
            price: a.price,
            quantity: a.quantity,
            total: a.total,
          })).slice(0, 50), // Limit to top 50 levels
          timestamp: orderBook.lastUpdated,
        },
      });
    });

    console.log(`📖 Order books updated: ${allOrderBooks.length} assets`);
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