/**
 * In-memory Order Store
 * Persists orders for retrieval and updates
 *
 * Following Single Responsibility Principle:
 * - Only handles order storage operations
 * - No business logic
 */

import { Order } from '../models/Order';

class OrderStore {
  private orders: Map<string, Order> = new Map();

  /**
   * Add a new order to the store
   */
  add(order: Order): void {
    this.orders.set(order.id, { ...order });
  }

  /**
   * Update an existing order with partial data
   */
  update(orderId: string, partial: Partial<Order>): Order | null {
    const existing = this.orders.get(orderId);
    if (!existing) {
      return null;
    }

    const updated: Order = {
      ...existing,
      ...partial,
    };

    this.orders.set(orderId, updated);
    return updated;
  }

  /**
   * Get order by ID
   */
  getById(orderId: string): Order | null {
    return this.orders.get(orderId) ?? null;
  }

  /**
   * Get all orders for a specific user (most recent first)
   */
  getByUser(userId: string): Order[] {
    const userOrders: Order[] = [];

    this.orders.forEach((order) => {
      if (order.userId === userId) {
        userOrders.push({ ...order });
      }
    });

    // Sort by createdAt descending (most recent first)
    return userOrders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get open orders for a user and specific asset
   */
  getOpenByUserAndAsset(userId: string, assetId: string): Order[] {
    const openOrders: Order[] = [];

    this.orders.forEach((order) => {
      if (
        order.userId === userId &&
        order.assetId === assetId &&
        order.status === 'open'
      ) {
        openOrders.push({ ...order });
      }
    });

    // Sort by createdAt ascending (oldest first for FIFO)
    return openOrders.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  /**
   * Get all open limit orders (for MarketDataService simulation)
   */
  getAllOpenLimitOrders(): Order[] {
    const openOrders: Order[] = [];

    this.orders.forEach((order) => {
      if (order.status === 'open' && order.orderType === 'limit') {
        openOrders.push({ ...order });
      }
    });

    // Sort by createdAt ascending (oldest first - FIFO)
    return openOrders.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  /**
   * Get all open limit orders for a specific asset
   */
  getOpenLimitOrdersByAsset(assetId: string): Order[] {
    const openOrders: Order[] = [];

    this.orders.forEach((order) => {
      if (
        order.assetId === assetId &&
        order.status === 'open' &&
        order.orderType === 'limit'
      ) {
        openOrders.push({ ...order });
      }
    });

    return openOrders.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  /**
   * Get all orders (for debugging)
   */
  getAll(): Order[] {
    return Array.from(this.orders.values());
  }

  /**
   * Get count of orders
   */
  count(): number {
    return this.orders.size;
  }
}

export default new OrderStore();