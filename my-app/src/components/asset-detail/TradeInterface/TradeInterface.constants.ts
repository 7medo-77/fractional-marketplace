/**
 * Trade Interface Constants
 * Centralized configuration values
 */

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 10000;
export const MIN_PRICE = 0.01;
export const MAX_PRICE = 1000000;

export const ORDER_SIDE_LABELS = {
  buy: 'Buy',
  sell: 'Sell',
} as const;

export const ORDER_TYPE_LABELS = {
  market: 'Market',
  limit: 'Limit',
} as const;

export const FORM_DEFAULTS = {
  side: 'buy' as const,
  orderType: 'market' as const,
  quantity: '',
  price: '',
};