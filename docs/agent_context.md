# Agent Context Guide

## Project: Fractional Marketplace

## Quick Links to Documentation
- [Architecture](./architecture.md)
- [Requirements](./PRD.md)
- [API Specification](./api-spec.md)
- [Data Schema](./schema.md)

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
- Optimized WebSocket subscriptions to avoid unnecessary updates
- Performance optimizations for real-time data

## EXISTING STRUCTURE REFERENCE
- Backend WebSocket: Updates every 500ms with order book data
- Current data format from backend (OrderBook interface):
```typescript
interface OrderBook {
  assetId: string;
  currentPrice: number;
  bids: Array<{ price: number; quantity: number; total: number; orderIds: string[] }>;
  asks: Array<{ price: number; quantity: number; total: number; orderIds: string[] }>;
  lastUpdated: string;
}
```

## TASK 1: Create Asset Detail Page Layout
**File**: `app/(dashboard)/assets/[assetId]/page.tsx`
Create a Server Component that:
1. Fetches initial asset data from `/api/v1/assets/[assetId]`
2. Creates a responsive layout with:
   - Left column: Asset info and trading interface (for later)
   - Center column: Chart tabs (Price History / Depth Chart)
   - Right column: Order Book
3. Uses Suspense boundaries for loading states
4. Implements error boundaries

## TASK 2: Implement Tabbed Hero Section
**Component**: `components/features/asset-detail/ChartTabs.tsx`
Create a tabbed interface with:
1. Two tabs: "Price History" and "Market Depth"
2. Each tab shows a different chart component
3. Smart WebSocket subscription:
   - "Price History" tab: Subscribe to trade executions only
   - "Market Depth" tab: Subscribe to order book updates only
4. Unsubscribe from unused events when switching tabs

## TASK 3: Price History Chart (Financial Line Chart)
**Component**: `components/features/asset-detail/PriceHistoryChart.tsx`
Using Recharts LineChart with:
1. **Angular lines** (no curves):
   ```tsx
   <Line
     type="stepAfter" // Creates angular financial chart style
     stroke="var(--bid-color)"
     strokeWidth={2}
     dot={false}
   />
   ```
2. X-axis: Time (last 24 hours)
3. Y-axis: Price with currency formatting
4. Grid lines and professional styling
5. Tooltip showing price, time, and volume
6. Mock data initially, connected to WebSocket for trade executions

## TASK 4: Order Book Component with Performance Optimizations
**Component**: `components/features/asset-detail/OrderBookTable.tsx`
Using TanStack Table with these advanced features:

### 4.1 Horizontal Split Layout
```tsx
<div className="grid grid-cols-2 gap-4">
  {/* Bids (Left) */}
  <OrderBookSide type="bid" data={bids} />

  {/* Asks (Right) */}
  <OrderBookSide type="ask" data={asks} />
</div>
```

### 4.2 CSS Variable Optimization (CRITICAL)
Instead of React re-rendering each row on every update:
```tsx
// BAD: Causes full DOM re-render on every update
<div style={{ width: `${percentage}%` }} />

// GOOD: Updates CSS variable only
<div style={{ '--order-depth': `${percentage}%` } as React.CSSProperties}>
  <div className="order-depth-bar" />
</div>
```

CSS:
```css
.order-depth-bar {
  width: calc(var(--order-depth, 0%) - 0.5rem);
  height: 100%;
  background: linear-gradient(
    to right,
    var(--bid-color) 0%,
    transparent 100%
  );
  opacity: 0.3;
  transition: width 100ms ease-out;
}
```

### 4.3 Mobile Responsiveness with TanStack Extension
Extend TanStack column definitions:
```typescript
import { createColumnHelper } from '@tanstack/react-table';

// Custom column helper with mobile view
const columnHelper = createColumnHelper<OrderBookRow>();

// Column definition with mobile configuration
const columns = [
  columnHelper.accessor('price', {
    header: 'Price',
    cell: info => formatCurrency(info.getValue()),
    mobileView: 'compact', // Custom property
    mobilePriority: 1,
  }),
];

// Hook to determine mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Component that adapts based on screen size
function ResponsiveOrderBook({ columns, data }) {
  const isMobile = useIsMobile();

  const table = useReactTable({
    columns: isMobile
      ? columns.filter(col => col.mobilePriority)
      : columns,
    data,
  });

  if (isMobile) {
    return <MobileOrderBookLadder data={data} />;
  }

  return <DesktopOrderBookTable table={table} />;
}
```

### 4.4 Mobile Ladder View
**Component**: `components/features/asset-detail/MobileOrderBookLadder.tsx`
Create a vertical depth-of-market display:
1. Price in middle column
2. Bids on left side flowing left
3. Asks on right side flowing right
4. Touch-friendly interaction

## TASK 5: Depth Chart Component
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

## TASK 6: Smart WebSocket Subscription Manager
**Hook**: `hooks/useSmartWebSocket.ts`
Create a hook that:
1. Manages multiple subscription types:
   ```typescript
   type SubscriptionType = 'orderbook' | 'trades' | 'all';
   ```
2. Only subscribes to necessary events based on active tab
3. Cleanly unsubscribes when component unmounts or tab changes
4. Buffers rapid updates to prevent UI jank
5. Implements requestAnimationFrame for batched updates

Implementation:
```typescript
export function useSmartWebSocket(assetId: string, activeTab: 'price' | 'depth') {
  const [orderBook, setOrderBook] = useState<OrderBook>();
  const [trades, setTrades] = useState<Trade[]>();

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3001/ws`);

    // Subscribe based on active tab
    ws.onopen = () => {
      if (activeTab === 'price') {
        ws.send(JSON.stringify({
          type: 'SUBSCRIBE_TRADES',
          assetId
        }));
      } else if (activeTab === 'depth') {
        ws.send(JSON.stringify({
          type: 'SUBSCRIBE_ORDERBOOK',
          assetId
        }));
      }
    };

    // Handle incoming messages
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Throttle updates using requestAnimationFrame
      requestAnimationFrame(() => {
        if (message.type === 'orderbook_update') {
          setOrderBook(message.data);
        } else if (message.type === 'trade_executed') {
          setTrades(prev => [message.data, ...(prev || []).slice(0, 100)]);
        }
      });
    };

    // Cleanup
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'UNSUBSCRIBE', assetId }));
        ws.close();
      }
    };
  }, [assetId, activeTab]); // Re-subscribe when tab changes

  return { orderBook, trades };
}
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

## TASK 8: Backend WebSocket Enhancements
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
│   ├── useSmartWebSocket.ts
│   └── useOrderBookData.ts
└── utils/
    └── chart-transforms.ts
```

### Step 2: Implement in Order
1. Start with `useSmartWebSocket` hook
2. Create `ChartTabs` with subscription logic
3. Implement `PriceHistoryChart` with angular lines
4. Build `OrderBookTable` with CSS variable optimization
5. Add mobile responsiveness with `useIsMobile` hook
6. Create `DepthChart` with gradient areas
7. Connect all components to WebSocket data

### Step 3: Testing Checklist
- [ ] Tab switching properly changes WebSocket subscriptions
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
6. **Clean WebSocket subscriptions** on tab changes

### WebSocket Best Practices:
- Subscribe only to needed data
- Unsubscribe immediately when not needed
- Buffer rapid updates
- Handle reconnection gracefully

## EXPECTED FINAL BEHAVIOR

1. User navigates to `/assets/asset_001`
2. Server fetches initial asset data
3. Client connects WebSocket based on active tab
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
4. Ensure WebSocket connections are managed properly

Start with Task 1 and provide progress updates after each task completion.
```

## **How to Use This Prompt with GitHub Copilot Agent**

### **Step-by-Step Agent Workflow:**

1. **Open all relevant context files:**
   ```bash
   code clean-code.md
   code globals.css
   # Keep existing project structure visible
   ```

2. **Start with foundation:**
   ```
   @workspace Let's begin implementing the asset detail page.
   First, create the page layout structure at app/(dashboard)/assets/[assetId]/page.tsx.
   Follow the clean-code.md principles and use server components where possible.
   ```

3. **Implement WebSocket manager:**
   ```
   @workspace Now create the useSmartWebSocket hook that manages subscriptions
   based on active tab. Make sure to implement proper cleanup and throttling.
   ```

4. **Build the order book with optimizations:**
   ```
   @workspace Create the OrderBookTable component with these specific features:
   1. Horizontal split layout
   2. CSS variable optimization (not inline styles)
   3. Mobile responsive with ladder view
   4. Use the colors from globals.css

   Show me the CSS implementation for the depth bars using CSS variables.
   ```

5. **Implement charts:**
   ```
   @workspace Now build the two chart components:
   1. PriceHistoryChart with angular lines (type="stepAfter")
   2. DepthChart with gradient areas

   Use Recharts and ensure they connect to the WebSocket data properly.
   ```

6. **Test performance:**
   ```
   @workspace Let's verify our optimizations.
   Can you show me React DevTools profiler results for:
   1. Order book updates with CSS variables vs inline styles
   2. Tab switching and WebSocket subscription changes
   3. Mobile vs desktop rendering
   ```

### **Verification Commands:**

```
@workspace Check if our WebSocket implementation properly:
1. Subscribes to orderbook updates when Depth tab is active
2. Subscribes to trades when Price History tab is active
3. Unsubscribes from unused events
4. Doesn't create memory leaks
```

```
@workspace Verify the order book uses CSS custom properties by:
1. Inspecting the DOM elements in browser devtools
2. Checking that --order-depth property is being updated
3. Confirming no style={...} inline updates on every tick
```

```
@workspace Test mobile responsiveness:
1. Create the useIsMobile hook
2. Implement the mobile ladder view
3. Ensure columns are filtered by mobilePriority
```

### **Debugging Help:**

If you encounter issues:

```
@workspace The chart isn't showing angular lines.
Check if we're using type="stepAfter" on the Line component.
```

```
@workspace The order book is re-rendering too much.
Verify we're using React.memo and CSS variables instead of inline styles.
```

```
@workspace WebSocket connections aren't closing properly.
Check the cleanup function in useEffect and ensure we send UNSUBSCRIBE message.
```

This comprehensive prompt will guide the agent through building a sophisticated, performance-optimized trading interface with real-time visualizations and smart data management.