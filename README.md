## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18.x or higher
- **Backend**: Running on `http://localhost:3001`

### Setup & Run
```sh
cd my-app
npm install
npm run dev
```

Access the app at **http://localhost:3000**.

**Environment Variables** (`.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

---

## 📂 Directory Structure

The src directory follows a feature-based organization:

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (global bridges mounted here)
│   ├── page.tsx                 # Home/landing page
│   ├── globals.css              # Global styles & theme variables
│   ├── assets/
│   │   ├── page.tsx             # Assets list (Server Component)
│   │   ├── loading.tsx          # Loading skeleton
│   │   ├── error.tsx            # Error boundary
│   │   └── [assetId]/
│   │       └── page.tsx         # Asset detail (Server Component)
│   ├── history/
│   │   └── page.tsx             # User order history
│   └── portfolio/
│       └── page.tsx             # Portfolio view
│
├── components/                   # React components
│   ├── asset-detail/            # Asset detail page components
│   │   ├── AssetDetail.types.ts # Shared type definitions
│   │   ├── TradeInterfaceWrapper.tsx
│   │   ├── charts/              # Price & Depth charts
│   │   ├── info-header/         # Asset header info
│   │   ├── order-book/          # Order book display
│   │   ├── skeleton/            # Loading skeletons
│   │   └── TradeInterface/      # Market/Limit order UI
│   │
│   ├── assets/                  # Assets list components
│   │   ├── AssetCardList.tsx   # List container
│   │   ├── card/                # Asset card component
│   │   └── header/              # List header
│   │
│   ├── history/                 # Order history components
│   │   ├── HistoryClient.tsx   # Client wrapper
│   │   ├── History.hooks.tsx   # Data fetching logic
│   │   ├── History.types.ts    # Type definitions
│   │   └── table/               # History table
│   │
│   ├── shared/                  # Global UI components
│   │   ├── header.tsx           # App header
│   │   ├── footer.tsx           # Connection status footer
│   │   ├── UserIdInitializer.tsx # User ID setup
│   │   └── status-bar/          # Status indicators
│   │
│   ├── socket/                  # Socket.io integration
│   │   └── SocketNotificationsBridge.tsx # Toast notifications
│   │
│   └── ui/                      # shadcn/ui components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── sonner.tsx           # Toast provider
│       ├── table.tsx
│       └── tabs.tsx
│
├── hooks/                       # Custom React hooks
│   ├── useSmartSocket.tsx       # Smart subscription management
│   ├── useSocket.tsx            # Basic socket hook
│   ├── useIsMobile.tsx          # Mobile detection
│   └── useDepthChartData.tsx    # Depth chart data processing
│
├── lib/                         # Core utilities
│   ├── api.ts                   # Typed API client
│   ├── socket.ts                # Socket.io singleton & helpers
│   ├── socketEvents.ts          # Event contracts & types
│   ├── utils/
│   │   ├── api-utils.ts         # API URL & error handling
│   │   ├── chart-utils.ts       # Chart data formatting
│   │   ├── History-utils.ts     # Order history utilities
│   │   ├── TradeInterface-utils.ts # Validation & formatting
│   │   ├── user-id.ts           # User identity management
│   │   └── utils.ts             # General utilities
│   └── workers/
│       └── depthChartWorkerClient.ts # Web Worker client
│
├── stores/                      # Zustand state management
│   ├── socketStore.tsx          # Global socket & real-time state
│   └── assetDetailStore.tsx     # (Deprecated - redirects to socketStore)
│
├── workers/                     # Web Workers
│   └── depthChart.worker.ts    # Offload depth chart calculations
│
└── types.ts                     # Shared TypeScript types
```

---

## 🏗 Architecture & Best Practices

### 1. Server Components First

Following **Next.js best practices**, data fetching happens in Server Components before rendering:

- **page.tsx**: Fetches assets on the server
- **[my-app/src/app/assets/[assetId]/page.tsx](my-app/src/app/assets/[assetId]/page.tsx)**: Fetches asset details server-side

Benefits:
- Improved SEO
- Reduced JavaScript bundle
- Secure backend access
- ISR (Incremental Static Regeneration) for caching

Example pattern:
```typescript
export default async function AssetsPage() {
  const assets = await getAssets(); // Server fetch
  return <AssetCardList initialAssets={assets} />; // Pass to client
}
```

### 2. Singleton Socket.io Pattern

The frontend maintains a **single WebSocket connection** across the entire app using socket.ts:

```typescript
let socket: Socket | null = null;

export function initializeSocket(): Socket {
  if (socket?.connected) return socket;
  socket = io(getSocketUrl(), { /* options */ });
  return socket;
}
```

**Advantages**:
- Only one connection regardless of route changes
- Centralized event handling
- Efficient resource usage

### 3. Ref-Counted Subscriptions

The `useSocketStore` uses **reference counting** to manage asset subscriptions:

- **First component** subscribes → sends `SUBSCRIBE_ASSET` event
- **Last component** unsubscribes → sends `UNSUBSCRIBE_ASSET` event

This prevents:
- Duplicate subscriptions
- Premature unsubscriptions
- Memory leaks

### 4. RequestAnimationFrame Buffering

Rapid socket updates (every 500ms) are **buffered** using `requestAnimationFrame` to prevent UI jank:

```typescript
const rafIdRef = useRef<number | null>(null);
const pendingOrderBookUpdate = useRef<OrderBook | null>(null);

const bufferOrderBookUpdate = useCallback((data: OrderBook) => {
  pendingOrderBookUpdate.current = data;
  if (rafIdRef.current === null) {
    rafIdRef.current = requestAnimationFrame(processUpdates);
  }
}, []);
```

### 5. Clean Code Principles (SRP)

Each file has a **single responsibility**:

- **Components**: Presentation only
- **Hooks**: Business logic & side effects
- **Utils**: Pure functions & transformations
- **Types**: Type definitions
- **Constants**: Shared constants

Example structure for a feature:
```
components/TradeInterface/
├── TradeInterface.tsx           # UI only
├── TradeInterface.hooks.tsx     # Logic (usePlaceOrder, useTradeForm)
├── TradeInterface.types.ts      # Type definitions
├── TradeInterface.utils.ts      # Validation, formatting
├── TradeInterface.constants.ts  # Magic numbers, defaults
```

---

## 🛠 State Management (Zustand)

The `useSocketStore` is the **single source of truth** for real-time data:

```typescript
interface SocketStore {
  // Connection
  socket: Socket | null;
  isConnected: boolean;

  // All-assets price feed
  assetPrices: Map<string, number>;
  lastUpdateTime: string | null;

  // Per-asset data
  orderBooksByAssetId: Record<AssetId, OrderBook | undefined>;
  priceHistoryByAssetId: Record<AssetId, PriceHistoryPoint[] | undefined>;

  // Subscription counting
  assetSubscriberCounts: Record<AssetId, number | undefined>;

  // User context
  userId: string | null;
  notifications: OrderNotification[];

  // Actions
  connect: () => Socket;
  disconnect: () => void;
  retainAsset: (assetId: string, initialPrice: number) => void;
  releaseAsset: (assetId: string) => void;
}
```

### Key Features:

1. **Memoized Selectors**: Prevent unnecessary re-renders
   ```typescript
   const orderBook = useSocketStore((s) => s.orderBooksByAssetId[assetId]);
   ```

2. **Bounded Notifications**: Keep only last 10 notifications
   ```typescript
   notifications: [...prevNotifications, newNotification].slice(-10)
   ```

3. **Per-Asset Subscription Tracking**:
   ```typescript
   assetSubscriberCounts: { 'asset_1': 2, 'asset_2': 1 }
   // Only unsubscribe when count reaches 0
   ```

---

## 🔌 Socket.io Handling

### Connection Lifecycle

**socket.ts** manages the singleton connection:

```typescript
export function initializeSocket(): Socket {
  if (socket?.connected) return socket;

  socket = io(getSocketUrl(), {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => console.log('Connected'));
  socket.on('disconnect', (reason) => console.log('Disconnected'));
  socket.on('connect_error', (error) => console.error('Error', error));

  return socket;
}
```

### Event Contracts

**socketEvents.ts** defines the client↔server contract:

```typescript
export const CLIENT_EVENTS = {
  SUBSCRIBE_ASSET: 'subscribe_asset',
  UNSUBSCRIBE_ASSET: 'unsubscribe_asset',
  SUBSCRIBE_ALL_ASSETS: 'subscribe_all_assets',
  PLACE_LIMIT_ORDER: 'place_limit_order',
  PLACE_MARKET_ORDER: 'place_market_order',
} as const;

export const SERVER_EVENTS = {
  ORDERBOOK_UPDATE: 'orderbook_update',
  ASSET_PRICE_UPDATE: 'asset_price_update',
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_FILLED: 'order_filled',
} as const;
```

### Event Subscriptions & Handlers

**socketStore.tsx** attaches listeners once:

```typescript
// Asset price updates (all assets)
socket.on(SERVER_EVENTS.ASSET_PRICE_UPDATE, (payload: AssetPriceUpdatePayload) => {
  set((state) => ({
    assetPrices: new Map(state.assetPrices).set(
      payload.data.assetId,
      payload.data.currentPrice
    ),
  }));
});

// Order book updates (per-asset)
socket.on(SERVER_EVENTS.ORDERBOOK_UPDATE, (payload: OrderbookUpdatePayload) => {
  set((state) => ({
    orderBooksByAssetId: {
      ...state.orderBooksByAssetId,
      [payload.data.assetId]: payload.data,
    },
  }));
});
```

### Smart Subscriptions Hook

**useSmartSocket.tsx** manages lifecycle:

```typescript
export function useSmartSocket({ assetId, initialPrice }: UseSmartSocketOptions) {
  const isConnected = useSocketStore((s) => s.isConnected);
  const retainAsset = useSocketStore((s) => s.retainAsset);
  const releaseAsset = useSocketStore((s) => s.releaseAsset);

  // Subscribe on mount, unsubscribe on unmount
  useEffect(() => {
    retainAsset(assetId, initialPrice);
    return () => releaseAsset(assetId);
  }, [assetId, initialPrice, retainAsset, releaseAsset]);

  // Return memoized selectors
  return {
    isConnected,
    orderBook: useSocketStore((s) => s.orderBooksByAssetId[assetId]),
    priceHistory: useSocketStore((s) => s.priceHistoryByAssetId[assetId]),
    currentPrice: orderBook?.currentPrice ?? initialPrice,
  };
}
```

---

## 👤 User Identity Management

**user-id.ts** provides stable user identification:

```typescript
export function getOrCreateUserId(): string {
  const now = Date.now();
  const userId = localStorage.getItem('fm_user_id');
  const expiry = localStorage.getItem('fm_user_id_exp');

  // Check if valid
  if (userId && expiry && now < parseInt(expiry)) {
    return userId;
  }

  // Create new
  const newUserId = `user_${uuidv4()}`;
  const newExpiry = now + 24 * 60 * 60 * 1000; // 24 hours

  localStorage.setItem('fm_user_id', newUserId);
  localStorage.setItem('fm_user_id_exp', newExpiry.toString());

  return newUserId;
}
```

**Used in**:
- `SocketNotificationsBridge` for filtering order events
- Order placement to associate orders with user
- Order history to fetch user-specific orders

---

## 🎯 Key Components

### 1. SocketNotificationsBridge

**Headless component** (no UI) that listens for socket events and shows toasts:

```typescript
export function SocketNotificationsBridge() {
  const notifications = useSocketStore((s) => s.notifications);

  useEffect(() => {
    if (notifications.length === 0) return;

    for (const n of notifications) {
      if (n.kind === 'confirmed') {
        toast.success('Order confirmed');
      } else if (n.kind === 'filled') {
        toast.success('Order filled');
      }
    }
  }, [notifications]);

  return null; // Invisible component
}
```

**Mounted in root layout** for global event handling.

### 2. TradeInterface

**Trading panel** with Market/Limit order placement:

- Buy/Sell toggle
- Order type tabs (Market/Limit)
- Quantity & Price inputs
- Form validation
- Socket emit on submit

Logic extracted into TradeInterface.hooks.tsx:
- `useTradeForm()`: Form state management
- `usePlaceOrder()`: Socket emit & error handling

### 3. OrderBookTable

**Optimized order book** with:
- CSS variables for depth bars (no inline styles)
- `React.memo` to prevent re-renders
- Horizontal split (bids/asks)
- Mobile ladder view via `useIsMobile()`

CSS optimization:
```typescript
// Instead of: style={{ width: `${depth}%` }}
// Use: style={{ '--order-depth': `${depth}%` }}
// With CSS: width: calc(var(--order-depth) * 1px);
```

### 4. Charts

**PriceHistoryChart** (Recharts LineChart):
- Angular lines (`type="stepAfter"`)
- Real-time data updates
- Mobile responsive

**DepthChart** (Recharts AreaChart):
- Gradient fills for bids/asks
- Web Worker for heavy calculations
- Smooth animations

---

## 📡 API Layer

**api.ts** provides typed REST functions:

### Server-Side Functions (ISR)
```typescript
export async function getAssets(): Promise<Asset[]> {
  // Revalidate every 60 seconds
  const response = await fetch(buildApiUrl('/assets'), serverFetchOptions);
  return handleApiResponse<Asset[]>(response, '/assets');
}
```

### Client-Side Functions (Fresh Data)
```typescript
export async function getAssetsClient(): Promise<Asset[]> {
  // Always fetch fresh data (cache: 'no-store')
  const response = await fetch(buildApiUrl('/assets'), clientFetchOptions);
  return handleApiResponse<Asset[]>(response, '/assets');
}

export async function placeLimitOrder(params: PlaceLimitOrderRequest): Promise<Order> {
  const response = await fetch(buildApiUrl('/orders'), {
    method: 'POST',
    body: JSON.stringify({ type: 'limit', ...params }),
  });
  return handleApiResponse<Order>(response, '/orders');
}
```

---

## 🎨 Styling

**globals.css** defines:

- **CSS Variables** for theming:
  ```css
  :root {
    --bid-color: rgb(34, 197, 94); /* Green */
    --ask-color: rgb(239, 68, 68); /* Red */
    --spread-color: rgb(107, 114, 128); /* Gray */
  }
  ```

- **Tailwind Integration**: shadcn/ui + custom colors
- **Performance**: CSS variables over inline styles

---

## 🚀 Performance Optimizations

1. **Code Splitting**: Dynamic imports for heavy components
   ```typescript
   const DepthChart = dynamic(() => import('./DepthChart'));
   ```

2. **Memoization**:
   ```typescript
   const maxBidQuantity = useMemo(() => calculateMax(bids), [bids]);
   ```

3. **RequestAnimationFrame Buffering**: Batches socket updates

4. **Web Workers**: Offload depth chart calculations

5. **CSS Variables**: Avoid re-renders from style changes

---

## 🧪 Testing Strategy

### Unit Tests
- Utility functions: `chart-utils.ts`, `user-id.ts`
- Hooks: Socket subscription logic

### Integration Tests
- Component mounting/unmounting
- Socket subscription lifecycle
- Form validation & submission

### Manual Testing
- Tab switching (subscription changes)
- Mobile responsiveness
- Socket reconnection
- Order placement flow

---

## 📝 Type Safety

**types.ts** defines shared types:

```typescript
export interface Asset {
  id: string;
  name: string;
  description: string;
  category: string;
  currentPrice: number;
  priceChange24h: number;
}

export interface OrderBook {
  assetId: string;
  currentPrice: number;
  spread: number;
  bestBid?: number;
  bestAsk?: number;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface Order {
  id: string;
  assetId: string;
  userId: string;
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  quantity: number;
  price?: number;
  status: 'open' | 'filled' | 'cancelled';
  createdAt: string;
}
```

---

## 🔍 Debugging & Monitoring

### Development Tools
- React DevTools Profiler (check re-renders)
- Chrome DevTools Network tab (socket messages)
- Console logging in development mode

### Connection Status
- `ConnectionStatus` badge in footer
- `LastUpdateTimestamp` shows freshness

### Error Boundaries
- Route-level error boundaries (`error.tsx`)
- Component-level error handling with fallbacks

---

## 📚 Additional Resources

- **Architecture**: architecture.md
- **Clean Code**: clean-code.md
- **API Spec**: api_spec.md
- **PRD**: PRD.md

---

## ✅ Summary

The **Fractional Marketplace** frontend exemplifies modern React/Next.js best practices:

- ✅ Server Components for SSR & performance
- ✅ Singleton Socket.io with ref-counted subscriptions
- ✅ Zustand for global real-time state
- ✅ RAF buffering for smooth updates
- ✅ Clean code with SRP
- ✅ Type-safe throughout
- ✅ Optimized rendering with CSS variables
- ✅ Responsive mobile design