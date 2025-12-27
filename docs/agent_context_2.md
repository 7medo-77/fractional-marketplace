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
## TASK 4: Price History Chart (Financial Line Chart)
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
2. X-axis: Time (last 100 ticks)
3. Y-axis: Price with currency formatting
4. Grid lines and professional styling
5. Tooltip showing price, time, and volume
6. Mock data initially, connected to socket.io for trade executions

## TASK 5: Order Book Component with Performance Optimizations
**Component**: `components/features/asset-detail/OrderBookTable.tsx`
Using TanStack Table with these advanced features:

### 5.1 Horizontal Split Layout
Implementing the "Depth Bar" (Fractional Visualization)

- In fractional trading, the "Size" or "Total" of an order is often visualized as a horizontal background bar.
- This is done by layering a div behind the text using absolute positioning.
- Do something like this, but using globals.css variables instead of fixed colors

```TypeScript
// Inside your Column Definition
{
  accessorKey: "bidSize",
  header: "Size",
  cell: ({ row }) => {
    const amount = row.getValue("bidSize") as number;
    const maxAmount = 100; // This should be calculated from your dataset
    const percentage = (amount / maxAmount) * 100;

    return (
      <div className="relative w-full text-right pr-2 py-1">
        {/* The Depth Bar */}
        <div
          className="absolute inset-y-0 right-0 bg-green-500/20 transition-all"
          style={{ width: `${percentage}%` }}
        />
        {/* The Actual Value */}
        <span className="relative z-10 font-mono text-green-400">
          {amount.toFixed(4)}
        </span>
      </div>
    );
  },
}
```

- In your shadcn table component, you would define the headers to group them:
```tsx

  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="text-green-500">Bid Price</TableHead>
        <TableHead className="text-green-500">Size</TableHead>
        <TableHead className="text-red-500 text-right">Size</TableHead>
        <TableHead className="text-red-500 text-right">Ask Price</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {table.getRowModel().rows.map(row => (
        <TableRow key={row.id} className="hover:bg-muted/50 border-none h-8">
          {row.getVisibleCells().map(cell => (
            <TableCell key={cell.id} className="p-0">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
```

### 5.2 CSS Variable Optimization (CRITICAL)
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

### 5.3 Mobile Responsiveness with TanStack Extension
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

### 5.4 Mobile Ladder View
**Component**: `components/features/asset-detail/MobileOrderBookLadder.tsx`
Create a vertical depth-of-market display (called a "Ladder" or "DOM" - Depth of Market):
1. You should split your order book data into two stacks.
2. The "Current Price" acts as the anchor point in the middle.
3. Asks (Top): Prices higher than the market price. Should be sorted descending (highest at the top, lowest at the bottom near the middle).
4. Bids (Bottom): Prices lower than the market price. Should be sorted descending (highest at the top near the middle, lowest at the bottom).
5. Touch-friendly interaction

### component architecture:
- Instead of one large table, use a flex container to ensure the "Middle" stays consistent, something like this:
- Using Flexbox for the Top Section: A common trick for the "Top" (Asks) section is to use flex-col-reverse. This ensures that as new prices are added or removed, the "lowest ask" (the one closest to the current price) always sits right above the middle divider, while the list grows upwards.
```TypeScript

export function VerticalOrderBook({ asks, bids, currentPrice }) {
  return (
    <div className="flex flex-col h-[600px] w-full bg-background border rounded-md overflow-hidden font-mono text-sm">
      {/* 1. ASKS SECTION (Red) */}
      <div className="flex-1 overflow-y-auto flex flex-col-reverse border-b">
        {asks.map((ask) => (
          <OrderBookRow key={ask.price} type="ask" data={ask} />
        ))}
      </div>

      {/* 2. SPREAD / CURRENT PRICE (Middle) */}
      <div className="py-2 bg-muted/30 flex justify-between px-4 border-y border-muted-foreground/20">
        <span className="text-lg font-bold">{currentPrice}</span>
        <span className="text-muted-foreground">Spread: {(asks[0].price - bids[0].price).toFixed(2)}</span>
      </div>

      {/* 3. BIDS SECTION (Green) */}
      <div className="flex-1 overflow-y-auto">
        {bids.map((bid) => (
          <OrderBookRow key={bid.price} type="bid" data={bid} />
        ))}
      </div>
    </div>
  );
}
```
- Implementing the Depth Visualization
- To make it a professional order book, you need "Depth Bars."
- Use a background div with a width calculated relative to the maximum volume in the current view.
- replace the fixed colors with colors from globals.css

```TypeScript
const OrderBookRow = ({ type, data }) => {
  const isAsk = type === "ask";
  const depthPercent = (data.amount / maxVolume) * 100;

  return (
    <div className="relative flex justify-between px-4 py-1 hover:bg-muted/50 cursor-pointer">
      {/* Background Depth Bar */}
      <div
        className={`absolute inset-y-0 right-0 ${isAsk ? 'bg-red-500/10' : 'bg-green-500/10'}`}
        style={{ width: `${depthPercent}%` }}
      />

      <span className={isAsk ? "text-red-500" : "text-green-500"}>
        {data.price.toFixed(2)}
      </span>
      <span className="relative z-10">{data.amount.toFixed(4)}</span>
    </div>
  );
};
```

## TASK Review: Complete Implementation Steps

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
1. Create `ChartTabs` with subscription logic
2. Implement `PriceHistoryChart` with angular lines
3. Build `OrderBookTable` with CSS variable optimization
4. Add mobile responsiveness with `useIsMobile` hook
5. Connect all components to socket.io data

### Step 3: Testing Checklist
- [ ] Tab switching properly changes socket.io subscriptions
- [ ] Price chart shows angular lines (no curves)
- [ ] Order book updates use CSS variables (check React DevTools re-renders)
- [ ] Mobile view shows ladder layout
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