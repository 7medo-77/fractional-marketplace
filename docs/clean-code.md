# Clean Code Principles for React/Next.js Frontend

## Core Principles for This Project

### 1. **Single Responsibility Principle (SRP)**
- Each component should do one thing well
- Separate data fetching, business logic, and presentation
- Example structure:

components/
FeatureName/
FeatureName.tsx # Main component
FeatureName.hooks.ts # Custom hooks for this feature
FeatureName.utils.ts # Utility functions
FeatureName.types.ts # TypeScript interfaces
FeatureName.constants.ts # Constants
text


### 2. **Custom Hooks for Logic Separation**
- Extract business logic and side effects into custom hooks
- Keep components focused on rendering
- Example pattern:
```typescript
// BAD: Logic mixed in component
function OrderBook() {
  const [data, setData] = useState();
  useEffect(() => {
    // WebSocket logic here
  }, []);
  // Rendering here
}

// GOOD: Logic in custom hook
function OrderBook() {
  const { bids, asks } = useOrderBook();
  return <OrderBookView bids={bids} asks={asks} />;
}
```

### 3. Component Composition Pattern

    Use composition over inheritance

    Create small, reusable components

    Pass components as props when needed

### 4. TypeScript Best Practices

    Define interfaces for all props

    Use type for unions, interface for objects

    Never use any type

### 5. Server Components First

    Use Server Components by default

    Only use Client Components when needed (interactivity, hooks, state)

    Mark Client Components with 'use client' directive

    Fetch data in Server Components

### 6. Error Boundary Pattern

    Wrap components with error boundaries

    Provide graceful error states

    Log errors appropriately

### 7. Loading States

    Show skeleton loaders during data fetching

    Use Suspense boundaries

    Implement optimistic updates where appropriate

### 8. File Structure Convention

```
app/
  (dashboard)/
    assets/
      [id]/
        page.tsx              # Server Component
        loading.tsx
        error.tsx
    layout.tsx
  layout.tsx
components/
  ui/                         # shadcn components
  features/                   # Feature-specific components
    order-book/
      OrderBook.tsx
      OrderBook.hooks.ts
      OrderBook.types.ts
  shared/                     # Shared components
hooks/
  useWebSocket.ts
  useOrderBook.ts
lib/
  api.ts
  websocket.ts
  utils.ts
types/
  index.ts
styles/
  globals.css
  theme.css

```

### 9. Naming Conventions

    Components: PascalCase (OrderBook.tsx)

    Hooks: camelCase starting with use (useOrderBook.ts)

    Utility functions: camelCase (formatCurrency.ts)

    Types/Interfaces: PascalCase (OrderBookData.ts)

    Constants: UPPER_SNAKE_CASE (MAX_ORDER_SIZE)

### 10. shadcn/ui Integration

    Use shadcn components for consistency

    Extend with custom styles when needed

    Maintain accessibility standards

### 11. Performance Guidelines

    Use React.memo() for expensive components

    Implement useMemo and useCallback appropriately

    Code split with dynamic imports

    Optimize images with Next.js Image component

### 12. Testing Strategy

    Write unit tests for utilities and hooks

    Integration tests for components

    Mock WebSocket and API calls

### 13. Code Documentation

    JSDoc comments for public functions

    Component prop documentation

    Complex logic explanations

### 14. State Management Rules

    Use React state for local UI state

    Use URL state for filter/sort/pagination

    Use Server Components for server state

    Consider Zustand only if complex client state needed

### 15. Environment Variables

    Prefix with NEXT_PUBLIC_ for client-side

    Use .env.local for secrets

    Validate with Zod in env.ts

Example Implementation Pattern:

// Feature folder structure
components/features/order-book/
├── OrderBook.tsx                    # Main component (Client)
├── OrderBook.hooks.ts               # Custom hooks
├── OrderBook.types.ts               # TypeScript types
├── OrderBook.utils.ts               # Utility functions
├── OrderBook.constants.ts           # Constants
├── OrderBookSkeleton.tsx            # Loading state
└── OrderBookError.tsx               # Error boundary

```typescript
// Server Component pattern
export default async function AssetsPage() {
  const assets = await getAssets(); // Server-side data fetching

  return (
    <div>
      <AssetsList assets={assets} />
      {/* Client Component for interactivity */}
      <OrderBookClientWrapper assetId="asset_001" />
    </div>
  );
}

// Custom hook pattern
export function useOrderBook(assetId: string) {
  const [data, setData] = useState<OrderBookData>();

  useEffect(() => {
    const ws = new WebSocket(/* ... */);
    // WebSocket logic
    return () => ws.close();
  }, [assetId]);

  return { data, isLoading, error };
}
```

## File Templates
### Server Component Template:
```typescript

import { Metadata } from 'next';
import { Suspense } from 'react';
import { getAssetData } from '@/lib/api';
import { AssetDetailsSkeleton } from '@/components/features/asset-details';

interface AssetPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AssetPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Asset ${id} | Fractional Marketplace`,
  };
}

export default async function AssetPage({ params }: AssetPageProps) {
  const { id } = await params;

  // Server-side data fetching
  const asset = await getAssetData(id);

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<AssetDetailsSkeleton />}>
        {/* Pass data to client components */}
        <AssetDetailsClient asset={asset} />
      </Suspense>
    </div>
  );
}
```

### Client Component Template:

```typescript

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrderBook } from './OrderBook.hooks';
import type { OrderBookProps } from './OrderBook.types';

export default function OrderBook({ assetId }: OrderBookProps) {
  const { data, isLoading, error } = useOrderBook(assetId);

  if (error) return <OrderBookError error={error} />;
  if (isLoading) return <OrderBookSkeleton />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Book</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Render order book data */}
      </CardContent>
    </Card>
  );
}
```

## Follow these guidelines to ensure maintainable, performant, and scalable code.