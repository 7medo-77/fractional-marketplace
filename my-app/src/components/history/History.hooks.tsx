/**
 * History Page Hooks
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Order } from '@/types';
import { getUserId } from '@/lib/utils/user-id';
import { buildApiUrl } from '@/lib/utils/api-utils';

interface UseOrderHistoryReturn {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOrderHistory(): UseOrderHistoryReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const userId = getUserId();

    if (!userId) {
      setOrders([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = buildApiUrl(`/orders/user/${userId}`);
      const response = await fetch(url, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
  };
}