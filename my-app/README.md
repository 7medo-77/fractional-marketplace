My-app workspace setup (Task 01)

Run these commands in `my-app` to install recommended dependencies and start development:

```bash
npm install
npm install recharts date-fns clsx tailwind-merge --save
npm install -D @types/recharts
npm run dev
```

Notes:
- Tailwind is configured via `tailwind.config.cjs` and global styles in `src/app/globals.css`.
- Scaffolded basic UI components are in `src/components/ui`.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# API Layer Usage Guide

## Overview
The API layer provides type-safe functions for communicating with the backend.

## Server Components vs Client Components

### Server Components (Recommended)
Use these functions in Server Components for better performance and SEO:

```typescript
import { getAssets, getAssetById, getOrderBook } from '@/lib/api';

// These use ISR (revalidate: 60 seconds)
const assets = await getAssets();
const asset = await getAssetById('asset_001');
const orderBook = await getOrderBook('asset_001');
```

### Client Components
Use these when you need fresh data on the client side:

```typescript
import {
  getAssetsClient,
  getAssetByIdClient,
  placeLimitOrder,
  placeMarketOrder
} from '@/lib/api';

// Always fetch fresh data (cache: 'no-store')
const assets = await getAssetsClient();

// Place orders (client-only operations)
const order = await placeLimitOrder({
  assetId: 'asset_001',
  type: 'buy',
  quantity: 10,
  price: 4500,
  userId: 'user_123'
});
```

## Error Handling

All API functions throw `ApiError` with proper typing:

```typescript
import { ApiError } from '@/types';

try {
  const assets = await getAssets();
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error [${error.statusCode}]:`, error.message);
    console.error('Endpoint:', error.endpoint);
  }
}
```

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## Type Safety

All functions have full TypeScript support:

- Request parameters are validated at compile time
- Response types match backend models
- No `any` types used

## Real-time Updates

For real-time data (order books, prices), use WebSocket instead of polling:

```typescript
// Use REST API for initial data
const initialOrderBook = await getOrderBook('asset_001');

// Then subscribe to WebSocket for updates
// (See WebSocket documentation)
```
