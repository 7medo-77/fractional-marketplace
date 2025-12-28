/**
 * Trade Interface Custom Hooks
 * Following clean code principles - logic separated from presentation
 */

'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getOrCreateUserId } from '@/lib/utils/user-id';
import { useSocketStore } from '@/stores/socketStore';
import type { TradeFormState, OrderResult, PlaceOrderParams } from './TradeInterface.types';
import { FORM_DEFAULTS } from './TradeInterface.constants';

/**
 * Hook for managing trade form state
 */
export function useTradeForm() {
  const [form, setForm] = useState<TradeFormState>(FORM_DEFAULTS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback(<K extends keyof TradeFormState>(
    field: K,
    value: TradeFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      quantity: '',
      price: '',
    }));
  }, []);

  const toggleSide = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      side: prev.side === 'buy' ? 'sell' : 'buy',
    }));
  }, []);

  const setOrderType = useCallback((orderType: TradeFormState['orderType']) => {
    setForm((prev) => ({
      ...prev,
      orderType,
      // Clear price when switching to market
      price: orderType === 'market' ? '' : prev.price,
    }));
  }, []);

  return {
    form,
    isSubmitting,
    setIsSubmitting,
    updateField,
    resetForm,
    toggleSide,
    setOrderType,
  };
}

/**
 * Hook for placing orders via Socket.io
 */
export function usePlaceOrder(assetId: string, isConnected: boolean) {
  const placeOrderViaStore = useSocketStore((s) => s.placeOrder);

  const placeOrder = useCallback(
    async (params: Omit<PlaceOrderParams, 'assetId' | 'userId'>): Promise<OrderResult> => {
      if (!isConnected) {
        toast.error('Not connected to server');
        return { success: false, error: 'Not connected to server' };
      }

      const userId = getOrCreateUserId();
      if (userId === 'ssr-placeholder') {
        toast.error('Unable to identify user');
        return { success: false, error: 'Unable to identify user' };
      }

      const ack = await placeOrderViaStore({
        assetId,
        userId,
        type: params.type,
        quantity: params.quantity,
        orderType: params.orderType,
        price: params.orderType === 'limit' ? params.price : undefined,
      });

      if (ack.ok && ack.order) {
        const message =
          params.orderType === 'market'
            ? `Market ${params.type} order filled!`
            : `Limit ${params.type} order placed!`;

        toast.success(message, {
          description:
            params.orderType === 'market' && ack.totalCost
              ? `Total: $${ack.totalCost.toFixed(2)}`
              : `Order ID: ${ack.order.id.slice(0, 8)}...`,
        });

        return { success: true, orderId: ack.order.id, totalCost: ack.totalCost };
      }

      toast.error('Order failed', { description: ack.error || 'Unknown error' });
      return { success: false, error: ack.error || 'Unknown error' };
    },
    [assetId, isConnected, placeOrderViaStore]
  );

  return { placeOrder };
}