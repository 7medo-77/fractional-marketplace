
### 4. **schema.md**
# Database Schema

## In-Memory Structure (for mock)

### Asset
```typescript
interface Asset {
  id: string;
  name: string;
  description: string;
  category: 'real-estate' | 'vehicles' | 'collectibles';
  totalShares: number;
  availableShares: number;
  currentPrice: number;
  priceHistory: Array<{price: number; timestamp: string}>;
}
```

### Order
```typescript

interface Order {
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
```
### OrderBook
```typescript

interface OrderBook {
  assetId: string;
  currentPrice: number;          // Market price (last traded)
  spread: number;                // Optional: difference between best bid/ask
  bestBid?: number;              // Optional: highest bid price
  bestAsk?: number;              // Optional: lowest ask price
  bids: Array<{
    price: number;
    quantity: number;
    total: number;
    orderIds: string[];
  }>;
  asks: Array<{
    price: number;
    quantity: number;
    total: number;
    orderIds: string[];
  }>;
  lastUpdated: string;
}

```
### Trade
```typescript

interface Trade {
  id: string;
  assetId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  price: number;
  executedAt: string;
}
```