# Agent Context Guide

## Project: Fractional Marketplace

## Quick Links to Documentation
- [Architecture](./architecture.md)
- [Requirements](./PRD.md)
- [API Specification](./api-spec.md)
- [Data Schema](./schema.md)
- [Clean code](./clean-code.md)

## Tech Stack
- Backend: Express.js + TypeScript
- Frontend: Next.js 16 + App Router + TypeScript + Zustand
- Real-time: Socket.io
- Styling: Tailwind CSS

# **Asset Detail Page Implementation Prompt**

```markdown
# ASSET DETAIL PAGE IMPLEMENTATION
## Complex Trading Interface with Real-time Charts

## CONTEXT
We're building the asset detail page at `/assets/[assetId]` with:
- Real-time price history chart (LineChart with angular financial style)
- Order book with horizontal split and gradient visualization
- Depth chart with area gradients
- Tabbed interface to switch between charts
- Optimized socket.io subscriptions to avoid unnecessary updates
- Performance optimizations for real-time data

## EXISTING STRUCTURE REFERENCE
- Backend socket.io: Updates every 500ms with order book data
- Current data format from backend (OrderBook interface):
```typescript

  interface OrderBookEntry {
    price: number;
    quantity: number;
    total: number;
    orderIds: string[];
  }

  interface OrderBook {
    assetId: string;
    currentPrice: number;          // Market price (last traded / drifted)
    spread: number;                // Difference between best bid/ask
    bestBid?: number;              // Highest bid price
    bestAsk?: number;              // Lowest ask price
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
    lastUpdated: string;
  }

```

## TASK 6: Depth Chart Component
**Component**: `components/features/asset-detail/DepthChart.tsx`
Using Recharts AreaChart with:
1. **Reference line** at current market price
2. **Two area plots** with gradients:
   - Bid side (green gradient fading to left)
   - Ask side (red gradient fading to right)
3. X-axis: Price levels
4. Y-axis: Cumulative quantity
5. Professional trading chart styling

CSS Gradient definitions (add to globals.css):
```css
/* Depth Chart Gradients */
.depth-bid-gradient {
  stop-color: var(--bid-color);
  stop-opacity: 0.8;
}

.depth-bid-gradient-fade {
  stop-color: var(--bid-color);
  stop-opacity: 0;
}

.depth-ask-gradient {
  stop-color: var(--ask-color);
  stop-opacity: 0.8;
}

.depth-ask-gradient-fade {
  stop-color: var(--ask-color);
  stop-opacity: 0;
}
```

Implementation:
```tsx
<AreaChart>
  <defs>
    <linearGradient id="bidGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="5%" className="depth-bid-gradient" />
      <stop offset="95%" className="depth-bid-gradient-fade" />
    </linearGradient>
    <linearGradient id="askGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="5%" className="depth-ask-gradient" />
      <stop offset="95%" className="depth-ask-gradient-fade" />
    </linearGradient>
  </defs>

  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
  <ReferenceLine x={currentPrice} stroke="var(--foreground)" strokeDasharray="3 3" />

  <Area
    type="stepAfter"
    dataKey="bidDepth"
    fill="url(#bidGradient)"
    stroke="var(--bid-color)"
  />
  <Area
    type="stepAfter"
    dataKey="askDepth"
    fill="url(#askGradient)"
    stroke="var(--ask-color)"
  />
</AreaChart>
```


## TASK 7: Performance Optimizations Bundle

### 7.1 Virtual Scrolling for Order Book
For large order books, implement virtualization:
```tsx
import { FixedSizeList as List } from 'react-window';

function VirtualizedOrderBook({ rows }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <OrderBookRow data={rows[index]} />
    </div>
  );

  return (
    <List
      height={400}
      itemCount={rows.length}
      itemSize={35}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

### 7.2 Memoization and Callback Optimization
```tsx
const OrderBookRow = React.memo(({ data }) => {
  // Memoize expensive calculations
  const depthPercentage = useMemo(
    () => (data.quantity / maxQuantity) * 100,
    [data.quantity, maxQuantity]
  );

  return (
    <div style={{ '--depth': `${depthPercentage}%` } as CSSProperties}>
      {/* Row content */}
    </div>
  );
});

OrderBookRow.displayName = 'OrderBookRow';
```

### 7.3 CSS Transitions for Smooth Updates
```css
.order-book-row {
  transition:
    --depth 100ms ease-out,
    background-color 150ms ease;
}

.order-book-row:hover {
  background-color: var(--muted);
}
```

## TASK 8: Backend socket.io Enhancements
Update `backend/src/handlers/socketEvents.ts`:
1. Add separate events for order book vs trades
2. Implement subscription management per client
3. Throttle updates when client can't keep up

```typescript
// New event types
const CLIENT_EVENTS = {
  SUBSCRIBE_ORDERBOOK: 'SUBSCRIBE_ORDERBOOK',
  SUBSCRIBE_TRADES: 'SUBSCRIBE_TRADES',
  UNSUBSCRIBE: 'UNSUBSCRIBE'
};

// Client subscription tracking
const clientSubscriptions = new Map();

socket.on(CLIENT_EVENTS.SUBSCRIBE_ORDERBOOK, (data) => {
  clientSubscriptions.set(socket.id, { type: 'orderbook', assetId: data.assetId });

  // Send order book updates every 500ms
  const interval = setInterval(() => {
    const orderBook = generateOrderBook(data.assetId);
    socket.emit('orderbook_update', orderBook);
  }, 500);

  socket.on('disconnect', () => clearInterval(interval));
});

socket.on(CLIENT_EVENTS.SUBSCRIBE_TRADES, (data) => {
  clientSubscriptions.set(socket.id, { type: 'trades', assetId: data.assetId });

  // Only send trade executions
  tradeEmitter.on('trade', (trade) => {
    if (trade.assetId === data.assetId) {
      socket.emit('trade_executed', trade);
    }
  });
});
```

## TASK 9: Create Utility Functions
**File**: `lib/chart-utils.ts`
Helper functions for:
1. Transforming order book data for depth chart
2. Calculating cumulative quantities
3. Formatting data for Recharts
4. Generating mock historical data

```typescript
export function prepareDepthChartData(
  bids: OrderBookLevel[],
  asks: OrderBookLevel[],
  currentPrice: number
): DepthChartPoint[] {
  // Sort and accumulate bids (descending)
  const sortedBids = [...bids].sort((a, b) => b.price - a.price);
  let bidCumulative = 0;
  const bidData = sortedBids.map(bid => {
    bidCumulative += bid.quantity;
    return {
      price: bid.price,
      bidDepth: bidCumulative,
      askDepth: 0
    };
  });

  // Sort and accumulate asks (ascending)
  const sortedAsks = [...asks].sort((a, b) => a.price - b.price);
  let askCumulative = 0;
  const askData = sortedAsks.map(ask => {
    askCumulative += ask.quantity;
    return {
      price: ask.price,
      bidDepth: 0,
      askDepth: askCumulative
    };
  });

  // Combine and sort all price points
  return [...bidData, ...askData]
    .sort((a, b) => a.price - b.price)
    .map(point => ({
      ...point,
      spread: Math.abs(point.price - currentPrice)
    }));
}
```

## TASK 10: Complete Implementation Steps

### Step 1: Create Component Structure
```
components/features/asset-detail/
├── AssetDetailHeader.tsx
├── ChartTabs.tsx
├── PriceHistoryChart.tsx
├── DepthChart.tsx
├── OrderBookTable/
│   ├── OrderBookTable.tsx
│   ├── OrderBookRow.tsx
│   ├── OrderBookSide.tsx
│   ├── MobileOrderBookLadder.tsx
│   └── OrderBookTable.types.ts
├── hooks/
│   ├── useSmartsocketIo.ts
│   └── useOrderBookData.ts
└── utils/
    └── chart-transforms.ts
```

### Step 2: Implement in Order
1. Start with `useSmartsocketIo` hook
2. Create `ChartTabs` with subscription logic
3. Implement `PriceHistoryChart` with angular lines
4. Build `OrderBookTable` with CSS variable optimization
5. Add mobile responsiveness with `useIsMobile` hook
6. Create `DepthChart` with gradient areas
7. Connect all components to socket.io data

### Step 3: Testing Checklist
- [ ] Tab switching properly changes socket.io subscriptions
- [ ] Price chart shows angular lines (no curves)
- [ ] Order book updates use CSS variables (check React DevTools re-renders)
- [ ] Mobile view shows ladder layout
- [ ] Depth chart has correct gradients
- [ ] No memory leaks on tab switching
- [ ] Smooth animations for data updates

## PERFORMANCE REMINDERS

### Critical Optimizations:
1. **CSS Variables over inline styles** for dynamic widths
2. **React.memo** for chart and table components
3. **useMemo** for data transformations
4. **Throttled updates** via requestAnimationFrame
5. **Virtual scrolling** for large datasets
6. **Clean socket.io subscriptions** on tab changes

### socket.io Best Practices:
- Subscribe only to needed data
- Unsubscribe immediately when not needed
- Buffer rapid updates
- Handle reconnection gracefully

## EXPECTED FINAL BEHAVIOR

1. User navigates to `/assets/asset_001`
2. Server fetches initial asset data
3. Client connects socket.io based on active tab
4. Charts update smoothly without jank
5. Switching tabs changes subscription type
6. Mobile users see optimized ladder view
7. All visualizations use theme colors from globals.css
8. Performance remains smooth with 500ms updates

## AGENT INSTRUCTIONS

Proceed step-by-step through the tasks. After each major component:
1. Test the functionality
2. Verify performance (no excessive re-renders)
3. Check mobile responsiveness
4. Ensure socket.io connections are managed properly

Start with Task 1 and provide progress updates after each task completion.
```