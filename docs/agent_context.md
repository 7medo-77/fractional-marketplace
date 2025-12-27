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

# **Agent Implementation Prompt**

```markdown
# FRONTEND INITIALIZATION TASKS
## Fractional Marketplace - Next.js Frontend Setup

## PROJECT CONTEXT
I'm building a fractional marketplace with:
- **Frontend**: Next.js 16 with App Router, TypeScript, Tailwind CSS + Zustand
- **Backend**: Express.js with Socket.io for real-time updates
- **Design**: shadcn/ui components, clean professional trading interface
- **Real-time**: socket.io updates every 500ms for order books

## TASKS TO COMPLETE (IN ORDER)

### TASK 1: Project Setup & Configuration
1. **Initialize Next.js project** with TypeScript, Tailwind CSS, App Router
2. **Install shadcn/ui** and configure with:
   - `Card`, `Button`, `Input`, `Label`, `Table`, `Tabs`, `Badge` components
   - Dark mode support
   - Consistent styling
3. **Install additional dependencies**:
   ```bash
   npm install recharts date-fns clsx tailwind-merge
   npm install -D @types/recharts
   ```

### TASK 2: Theme & Layout Setup

File: app/layout.tsx
 - **Create a clean, professional trading interface layout with**:
    Header:

        Logo/App name: "Fractional Marketplace"

        Navigation: Assets, Portfolio, Trading History

        User menu placeholder

        Current time/date display

    Main Content Area:

        Max-width container

        Responsive padding

        Consistent spacing

    Footer:

        Copyright notice

        Status indicator (socket.io connection status)

        Version info

    Theme Provider:

        Implement shadcn theme

        Support system preference for dark/light mode

        Consistent typography

### TASK 3: Global Styles & Theme

File: app/globals.css
Define a professional trading color theme with CSS variables:
```css

:root {
  /* Primary Colors - Professional Trading Theme */
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;

  /* Success (Bids/Green) */
  --success: 142.1 76.2% 36.3%;
  --success-foreground: 355.7 100% 97.3%;

  /* Danger (Asks/Red) */
  --danger: 0 84.2% 60.2%;
  --danger-foreground: 0 0% 98%;

  /* Trading Specific Colors */
  --bid-color: 142.1 76.2% 36.3%;      /* Green for bids */
  --ask-color: 0 84.2% 60.2%;          /* Red for asks */
  --spread-color: 217.2 91.2% 59.8%;   /* Blue for spread */
  --volume-color: 262.1 83.3% 57.8%;   /* Purple for volume */

  /* Neutral Colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96.1%;

  /* Chart Colors */
  --chart-1: 12 76% 61%;
  --chart-2: 173 58% 39%;
  --chart-3: 197 37% 24%;

  /* Spacing Scale */
  --radius: 0.5rem;
  --spacing-unit: 0.25rem;
}

.dark {
  /* Dark mode overrides */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 47.4% 11.2%;
  --bid-color: 142.1 70.6% 45.3%;      /* Brighter green in dark */
  --ask-color: 0 72.2% 50.6%;          /* Brighter red in dark */
}
```

### TASK 4: API Layer Setup

File: lib/api.ts
- Create a clean API service layer:

    Base API configuration with error handling

    Server-side fetch functions for Server Components

    Client-side fetch functions for Client Components

    Type-safe API responses

```typescript

// Example structure
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function getAssets(): Promise<Asset[]> {
  const response = await fetch(`${API_BASE_URL}/assets`, {
    next: { revalidate: 60 }, // ISR: Revalidate every 60 seconds
  });

  if (!response.ok) {
    throw new Error('Failed to fetch assets');
  }

  return response.json();
}
```

### TASK 5: Assets Page (Server Component)

File: app/(dashboard)/assets/page.tsx
Create the main assets listing page that:

    Server-side fetches assets from /api/v1/assets

    Displays asset cards with:

        Asset name and description

        Current price (from initial API fetch)

        Category badge

        Available shares

        Price change indicator

    Real-time price updates via socket.io (client component)

    Search and filter functionality (client-side)

Backend requirements:

    Create /api/v1/assets endpoint in backend/src/controllers/OrderController.ts

    Return mock asset data (3-5 sample assets)

    Each asset should have: id, name, description, category, totalShares, availableShares, initialPrice

### TASK 6: socket.io Integration Setup

Files:

    lib/socketIo.ts - socket.io client utilities

    store/socketIoStore.tsx - Zustand store for socket.io

    hooks/usesocketIo.ts - Custom hook for socket.io access

Requirements:

    Connect to ws://localhost:3001/ws

    Implement automatic reconnection

    Subscribe to all assets: CLIENT_EVENTS.SUBSCRIBE_ALL_ASSETS

    Handle price updates and broadcast to components

    Clean connection on unmount

Backend socket.io handler:
Update backend/src/handlers/socketEvents.ts to:

    Accept CLIENT_EVENTS.SUBSCRIBE_ALL_ASSETS event

    Broadcast price updates for all assets every 500ms

    Include currentPrice in updates (as discussed)

### TASK 7: Asset Card Component

File: components/features/assets/AssetCard.tsx
Create a reusable AssetCard component that:

    Displays asset information

    Shows real-time price updates (via socket.io)

    Has a "View Details" link to asset detail page

    Responsive design

    Price change indicators (green/red)

### TASK 8: Price Display Component

File: components/shared/PriceDisplay.tsx
Create a component that:

    Displays price with proper formatting ($X,XXX.XX)

    Shows percentage change

    Updates in real-time via socket.io

    Color-coded (green for positive, red for negative)

### TASK 9: Status Indicators

Create components for:

    socket.io connection status

    Last update timestamp

    Market status (open/closed simulation)

### TASK 10: Loading & Error States

Implement:

    Skeleton loaders for assets page

    Error boundaries

    Empty states

## IMPLEMENTATION RULES (MUST FOLLOW)
1. Server Components First

    Fetch data in Server Components using async/await

    Pass data as props to Client Components

    Mark Client Components with 'use client'

    Use Suspense for loading states

2. Clean Code Principles (Refer to clean-code.md)

    Single Responsibility Principle

    Custom hooks for logic

    TypeScript strict mode

    Proper error handling

3. shadcn/ui Components

    Use shadcn components consistently

    Extend with custom styles when needed

    Maintain accessibility

4. Performance

    Implement ISR for asset data (revalidate: 60)

    Use dynamic imports for heavy components

    Optimize images (if any)

    Implement proper loading states

5. Type Safety

    Create proper TypeScript interfaces in types/

    No any types allowed

    Validate API responses

EXPECTED FILE STRUCTURE
``` text

fractional-frontend/
├── app/
│   ├── (dashboard)/
│   │   ├── assets/
│   │   │   ├── page.tsx              # Server Component
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   └── layout.tsx                # Dashboard layout
│   ├── layout.tsx                    # Root layout
│   └── globals.css
├── components/
│   ├── ui/                          # shadcn components
│   ├── features/
│   │   └── assets/
│   │       ├── AssetCard.tsx
│   │       ├── AssetCardSkeleton.tsx
│   │       └── AssetList.tsx
│   └── shared/
│       ├── Header.tsx
│       ├── Footer.tsx
│       ├── PriceDisplay.tsx
│       └── StatusIndicator.tsx
├── stores/
│   └── socketIoStore.tsx
├── hooks/
│   ├── usesocket.io.ts
│   └── useAssets.ts
├── lib/
│   ├── api.ts
│   └── socketIo.ts
├── types/
│   └── index.ts
└── styles/
    └── theme.css
```