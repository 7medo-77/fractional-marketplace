export interface Asset {
  id: string;
  name: string;
  description: string;
  category: 'real-estate' | 'vehicles' | 'collectibles';
  totalShares: number;
  availableShares: number;
  currentPrice: number;
  priceHistory: Array<{ price: number; timestamp: string }>;
}