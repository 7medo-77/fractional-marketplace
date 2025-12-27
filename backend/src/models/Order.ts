export interface Order {
  id: string;
  assetId: string;
  userId: string;
  type: 'bid' | 'ask';
  orderType: 'limit' | 'market';
  quantity: number;
  price?: number; // Required for limit orders
  status: 'open' | 'filled' | 'partial' | 'cancelled';
  createdAt: string;
  filledAt?: string;
}