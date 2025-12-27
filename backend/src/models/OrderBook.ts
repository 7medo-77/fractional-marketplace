export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
  orderIds: string[];
}

export interface OrderBook {
  assetId: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastUpdated: string;
}