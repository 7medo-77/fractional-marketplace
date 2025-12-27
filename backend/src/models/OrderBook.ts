export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
  orderIds: string[];
}

export interface OrderBook {
  assetId: string;
  currentPrice: number;          // Market price (last traded / drifted)
  spread: number;                // Difference between best bid/ask
  bestBid?: number;              // Highest bid price
  bestAsk?: number;              // Lowest ask price
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastUpdated: string;
}