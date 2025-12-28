/**
 * Trade Interface Utility Functions
 * Following Single Responsibility Principle
 */

import type { TradeFormState, ValidationResult, OrderSide } from '../../components/asset-detail/TradeInterface/TradeInterface.types';
import { MIN_QUANTITY, MAX_QUANTITY, MIN_PRICE, MAX_PRICE } from '../../components/asset-detail/TradeInterface/TradeInterface.constants';

/**
 * Validate trade form inputs
 */
export function validateTradeForm(
  form: TradeFormState,
  isConnected: boolean
): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  if (!isConnected) {
    errors.general = 'Not connected to server';
    return { isValid: false, errors };
  }

  // Validate quantity
  const quantity = parseFloat(form.quantity);
  if (!form.quantity || isNaN(quantity)) {
    errors.quantity = 'Quantity is required';
  } else if (quantity < MIN_QUANTITY) {
    errors.quantity = `Minimum quantity is ${MIN_QUANTITY}`;
  } else if (quantity > MAX_QUANTITY) {
    errors.quantity = `Maximum quantity is ${MAX_QUANTITY}`;
  } else if (!Number.isInteger(quantity)) {
    errors.quantity = 'Quantity must be a whole number';
  }

  // Validate price (only for limit orders)
  if (form.orderType === 'limit') {
    const price = parseFloat(form.price);
    if (!form.price || isNaN(price)) {
      errors.price = 'Price is required for limit orders';
    } else if (price < MIN_PRICE) {
      errors.price = `Minimum price is $${MIN_PRICE}`;
    } else if (price > MAX_PRICE) {
      errors.price = `Maximum price is $${MAX_PRICE.toLocaleString()}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Calculate estimated total for the trade
 */
export function calculateEstimatedTotal(
  form: TradeFormState,
  currentPrice: number,
  bestBid?: number,
  bestAsk?: number
): number | null {
  const quantity = parseFloat(form.quantity);
  if (isNaN(quantity) || quantity <= 0) {
    return null;
  }

  if (form.orderType === 'limit') {
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) {
      return null;
    }
    return quantity * price;
  }

  // Market order: use best available price
  if (form.side === 'buy') {
    const price = bestAsk ?? currentPrice;
    return quantity * price;
  } else {
    const price = bestBid ?? currentPrice;
    return quantity * price;
  }
}

/**
 * Get button color class based on order side
 */
export function getButtonColorClass(side: OrderSide): string {
  return side === 'buy'
    ? 'bg-green-600 hover:bg-green-700 text-white'
    : 'bg-red-600 hover:bg-red-700 text-white';
}

/**
 * Get side toggle button class
 */
export function getSideToggleClass(side: OrderSide, isActive: boolean): string {
  if (!isActive) {
    return 'bg-muted text-muted-foreground hover:bg-muted/80';
  }
  return side === 'buy'
    ? 'bg-green-600 text-white'
    : 'bg-red-600 text-white';
}