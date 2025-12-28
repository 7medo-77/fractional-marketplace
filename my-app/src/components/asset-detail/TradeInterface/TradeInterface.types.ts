/**
 * Trade Interface Types
 * Following TypeScript best practices - no 'any' types
 */

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';

export interface TradeFormState {
  side: OrderSide;
  orderType: OrderType;
  quantity: string;
  price: string;
}

export interface TradeInterfaceProps {
  assetId: string;
  currentPrice: number;
  bestBid?: number;
  bestAsk?: number;
  isConnected: boolean;
}

export interface PlaceOrderParams {
  assetId: string;
  type: OrderSide;
  orderType: OrderType;
  quantity: number;
  price?: number;
  userId: string;
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
  totalCost?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: {
    quantity?: string;
    price?: string;
    general?: string;
  };
}