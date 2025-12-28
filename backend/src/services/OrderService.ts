/**
 * Order Service
 * Handles order placement business logic and persistence
 *
 * Following Single Responsibility Principle:
 * - Creates and validates orders
 * - Persists to OrderStore
 * - Creates trades for filled orders
 */

import { Order } from '../models/Order';
import { Trade } from '../models/Trade';
import { v4 as uuidv4 } from 'uuid';
import OrderStore from '../store/OrderStore';
import TradeStore from '../store/TradeStore';
import OrderBookStore from '../store/OrderBookStore';
import AssetStore from '../store/AssetStore';

export interface PlaceLimitOrderParams {
  assetId: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  userId: string;
}

export interface PlaceMarketOrderParams {
  assetId: string;
  type: 'buy' | 'sell';
  quantity: number;
  userId: string;
}

export interface MarketOrderResult {
  order: Order;
  totalCost: number;
  trades: Trade[];
}

class OrderService {
  /**
   * Place a limit order
   * Creates order with status 'open' and persists to store
   */
  async placeLimitOrder(params: PlaceLimitOrderParams): Promise<Order> {
    // Validate asset exists
    const asset = AssetStore.getAsset(params.assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${params.assetId}`);
    }

    // Validate quantity
    if (params.quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    // Validate price
    if (params.price <= 0) {
      throw new Error('Price must be positive');
    }

    // Create the order
    const order: Order = {
      id: uuidv4(),
      assetId: params.assetId,
      userId: params.userId,
      type: params.type === 'buy' ? 'bid' : 'ask',
      orderType: 'limit',
      quantity: params.quantity,
      price: params.price,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    // Persist to store
    OrderStore.add(order);

    console.log(`📝 Limit order created: ${order.id} (${params.type} ${params.quantity} @ ${params.price})`);

    return order;
  }

  /**
   * Place a market order
   * Creates order with status 'filled' immediately
   * Calculates total cost based on current order book
   */
  async placeMarketOrder(params: PlaceMarketOrderParams): Promise<MarketOrderResult> {
    // Validate asset exists
    const asset = AssetStore.getAsset(params.assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${params.assetId}`);
    }

    // Validate quantity
    if (params.quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    // Get current order book
    const orderBook = OrderBookStore.getOrderBook(params.assetId);

    // Calculate total cost based on order type
    let totalCost = 0;
    let remainingQuantity = params.quantity;
    const trades: Trade[] = [];

    if (params.type === 'buy') {
      // Buy: consume asks (lowest first)
      const sortedAsks = [...orderBook.asks].sort((a, b) => a.price - b.price);

      for (const ask of sortedAsks) {
        if (remainingQuantity <= 0) break;

        const fillQuantity = Math.min(remainingQuantity, ask.quantity);
        const fillCost = fillQuantity * ask.price;

        totalCost += fillCost;
        remainingQuantity -= fillQuantity;

        // Create trade record
        const trade: Trade = {
          id: uuidv4(),
          assetId: params.assetId,
          buyerId: params.userId,
          sellerId: 'market_maker', // Mock seller
          quantity: fillQuantity,
          price: ask.price,
          executedAt: new Date().toISOString(),
        };

        trades.push(trade);
        TradeStore.addTrade(trade);
      }
    } else {
      // Sell: consume bids (highest first)
      const sortedBids = [...orderBook.bids].sort((a, b) => b.price - a.price);

      for (const bid of sortedBids) {
        if (remainingQuantity <= 0) break;

        const fillQuantity = Math.min(remainingQuantity, bid.quantity);
        const fillCost = fillQuantity * bid.price;

        totalCost += fillCost;
        remainingQuantity -= fillQuantity;

        // Create trade record
        const trade: Trade = {
          id: uuidv4(),
          assetId: params.assetId,
          buyerId: 'market_maker', // Mock buyer
          sellerId: params.userId,
          quantity: fillQuantity,
          price: bid.price,
          executedAt: new Date().toISOString(),
        };

        trades.push(trade);
        TradeStore.addTrade(trade);
      }
    }

    // If we couldn't fill the entire order, use current price for remainder
    if (remainingQuantity > 0) {
      const remainingCost = remainingQuantity * asset.currentPrice;
      totalCost += remainingCost;

      // Create trade for remainder at current price
      const trade: Trade = {
        id: uuidv4(),
        assetId: params.assetId,
        buyerId: params.type === 'buy' ? params.userId : 'market_maker',
        sellerId: params.type === 'sell' ? params.userId : 'market_maker',
        quantity: remainingQuantity,
        price: asset.currentPrice,
        executedAt: new Date().toISOString(),
      };

      trades.push(trade);
      TradeStore.addTrade(trade);
    }

    // Create the filled order
    const order: Order = {
      id: uuidv4(),
      assetId: params.assetId,
      userId: params.userId,
      type: params.type === 'buy' ? 'bid' : 'ask',
      orderType: 'market',
      quantity: params.quantity,
      status: 'filled',
      createdAt: new Date().toISOString(),
      filledAt: new Date().toISOString(),
    };

    // Persist to store
    OrderStore.add(order);

    console.log(`💰 Market order filled: ${order.id} (${params.type} ${params.quantity}) - Total: $${totalCost.toFixed(2)}`);

    return {
      order,
      totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimals
      trades,
    };
  }

  /**
   * Fill a limit order (called by MarketDataService)
   * Updates order status to 'filled' and creates a trade
   */
  fillLimitOrder(orderId: string): { order: Order; trade: Trade } | null {
    const order = OrderStore.getById(orderId);

    if (!order || order.status !== 'open') {
      return null;
    }

    const asset = AssetStore.getAsset(order.assetId);
    if (!asset) {
      return null;
    }

    // Update order to filled
    const filledOrder = OrderStore.update(orderId, {
      status: 'filled',
      filledAt: new Date().toISOString(),
    });

    if (!filledOrder) {
      return null;
    }

    // Create trade at order price (for limit orders)
    const trade: Trade = {
      id: uuidv4(),
      assetId: order.assetId,
      buyerId: order.type === 'bid' ? order.userId : 'market_maker',
      sellerId: order.type === 'ask' ? order.userId : 'market_maker',
      quantity: order.quantity,
      price: order.price!, // Limit orders always have a price
      executedAt: new Date().toISOString(),
    };

    TradeStore.addTrade(trade);

    console.log(`✅ Limit order filled: ${order.id} (${order.type} ${order.quantity} @ ${order.price})`);

    return { order: filledOrder, trade };
  }

  /**
   * Get orders for a user
   */
  getOrdersByUser(userId: string): Order[] {
    return OrderStore.getByUser(userId);
  }

  /**
   * Get order by ID
   */
  getOrderById(orderId: string): Order | null {
    return OrderStore.getById(orderId);
  }
}

export default new OrderService();