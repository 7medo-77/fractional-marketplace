/**
 * Trade Interface Component
 * Professional trading panel for placing market and limit orders
 *
 * Following clean code principles:
 * - Presentation only - logic in hooks
 * - Type safe - no 'any' types
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { getOrCreateUserId } from '@/lib/utils/user-id';
import { formatCurrency } from '@/lib/utils/utils';
import type { TradeInterfaceProps } from './TradeInterface.types';
import { useTradeForm, usePlaceOrder } from './TradeInterface.hooks';
import { validateTradeForm, calculateEstimatedTotal, getSideToggleClass } from '../../../lib/utils/TradeInterface-utils';
import { ORDER_SIDE_LABELS, ORDER_TYPE_LABELS } from './TradeInterface.constants';

export function TradeInterface({
  assetId,
  currentPrice,
  bestBid,
  bestAsk,
  isConnected,
}: TradeInterfaceProps) {
  const [, setUserId] = useState<string | null>(null);

  const {
    form,
    isSubmitting,
    setIsSubmitting,
    updateField,
    resetForm,
    toggleSide,
    setOrderType,
  } = useTradeForm();

  const { placeOrder } = usePlaceOrder(assetId, isConnected);

  // Initialize userId on mount
  useEffect(() => {
    const id = getOrCreateUserId();
    if (id !== 'ssr-placeholder') {
      setUserId(id);
    }
  }, []);

  // Validation
  const validation = validateTradeForm(form, isConnected);
  const estimatedTotal = calculateEstimatedTotal(form, currentPrice, bestBid, bestAsk);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.isValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await placeOrder({
        type: form.side,
        orderType: form.orderType,
        quantity: parseInt(form.quantity, 10),
        price: form.orderType === 'limit' ? parseFloat(form.price) : undefined,
      });

      if (result.success) {
        resetForm();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Trade</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Buy/Sell Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className={getSideToggleClass('buy', form.side === 'buy')}
              onClick={() => form.side !== 'buy' && toggleSide()}
            >
              {ORDER_SIDE_LABELS.buy}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={getSideToggleClass('sell', form.side === 'sell')}
              onClick={() => form.side !== 'sell' && toggleSide()}
            >
              {ORDER_SIDE_LABELS.sell}
            </Button>
          </div>

          {/* Order Type Tabs */}
          <Tabs value={form.orderType} onValueChange={(v) => setOrderType(v as 'market' | 'limit')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="market">{ORDER_TYPE_LABELS.market}</TabsTrigger>
              <TabsTrigger value="limit">{ORDER_TYPE_LABELS.limit}</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (shares)</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="0"
              min="1"
              step="1"
              value={form.quantity}
              onChange={(e) => updateField('quantity', e.target.value)}
              className={validation.errors.quantity ? 'border-destructive' : ''}
            />
            {validation.errors.quantity && (
              <p className="text-xs text-destructive">{validation.errors.quantity}</p>
            )}
          </div>

          {/* Price Input (Limit orders only) */}
          {form.orderType === 'limit' && (
            <div className="space-y-2">
              <Label htmlFor="price">Price per share</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  className={`pl-7 ${validation.errors.price ? 'border-destructive' : ''}`}
                />
              </div>
              {validation.errors.price && (
                <p className="text-xs text-destructive">{validation.errors.price}</p>
              )}
            </div>
          )}

          {/* Market Price Reference */}
          {form.orderType === 'market' && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market Price:</span>
                <span className="font-medium">{formatCurrency(currentPrice)}</span>
              </div>
              {form.side === 'buy' && bestAsk && (
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Best Ask:</span>
                  <span className="font-medium text-red-500">{formatCurrency(bestAsk)}</span>
                </div>
              )}
              {form.side === 'sell' && bestBid && (
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Best Bid:</span>
                  <span className="font-medium text-green-500">{formatCurrency(bestBid)}</span>
                </div>
              )}
            </div>
          )}

          {/* Estimated Total */}
          <div className="rounded-md border p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated Total:</span>
              <span className="font-semibold">
                {estimatedTotal !== null ? formatCurrency(estimatedTotal) : '—'}
              </span>
            </div>
          </div>

          {/* Connection Status Warning */}
          {!isConnected && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              Not connected to server. Please wait...
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className={`w-full ${form.side === 'buy'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
              }`}
            disabled={!validation.isValid || isSubmitting || !isConnected}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing Order...
              </>
            ) : (
              `${ORDER_SIDE_LABELS[form.side]} ${form.orderType === 'market' ? 'Market' : 'Limit'}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}