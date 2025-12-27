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


## TASK 2: Smart socket.io Subscription Manager
**Hook**: `hooks/useSmartsocket.io.ts`
Create a hook that:
1. Manages multiple subscription types:
   ```typescript
   type SubscriptionType = 'orderbook' | 'trades' | 'all';
   ```
2. Only subscribes to necessary events based on active tab
3. Cleanly unsubscribes when component unmounts or tab changes
4. Buffers rapid updates to prevent UI jank
5. Implements requestAnimationFrame for batched updates

Implementation: similar to the code below, but with socket.io
- keep in mind that event names are stored in [socketEvents.ts](/home/ahmed/all_repos/fractional-marketplace/my-app/src/lib/socketEvents.ts)
```typescript
export function useSmartsocketIo(assetId: string, activeTab: 'price' | 'depth') {
  const [orderBook, setOrderBook] = useState<OrderBook>();
  const [trades, setTrades] = useState<Trade[]>();

  useEffect(() => {
    const ws = new socket.io(`ws://localhost:3001/ws`);

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
      if (ws.readyState === socket.io.OPEN) {
        ws.send(JSON.stringify({ type: 'UNSUBSCRIBE', assetId }));
        ws.close();
      }
    };
  }, [assetId, activeTab]); // Re-subscribe when tab changes

  return { orderBook, trades };
}
```

## TASK 3: Implement Tabbed Hero Section
**Component**: `components/features/asset-detail/ChartTabs.tsx`
Create a tabbed interface with:
1. Two tabs: "Price History" and "Market Depth"
2. Each tab shows a different chart component
3. Smart socket.io subscription:
   - "Price History" tab: Subscribe to CLIENT_EVENTS.SUBSCRIBE_ASSET, asset:assetId
   - "Market Depth" tab: Subscribe to order book updates only
4. Unsubscribe from unused events when switching tabs

## PERFORMANCE REMINDERS

### Critical Optimizations:
3. **useMemo** for data transformations
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
4. Switching tabs changes subscription type
5. Performance remains smooth with 500ms updates

## AGENT INSTRUCTIONS

Proceed step-by-step through the tasks. After each major component:
1. Test the functionality
2. Verify performance (no excessive re-renders)
3. Check mobile responsiveness
4. Ensure socket.io connections are managed properly

Start with Task 1 and provide progress updates after each task completion.
```