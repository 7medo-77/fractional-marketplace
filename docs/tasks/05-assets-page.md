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
