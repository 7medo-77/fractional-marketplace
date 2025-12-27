# System Architecture

## Overview
Two-tier architecture with Next.js frontend and Express.js backend.

## Components

### Frontend (Next.js 16 with App Router)
- **Pages**:
  - Asset Detail Page (`/assets/[id]`)
  - Portfolio Page
  - Trade History
- **Components**:
  - OrderBook (Real-time updates via WebSocket)
  - TradingInterface (Limit/Market orders)
  - PriceChart
  - AssetDetailsCard
- **State Management**: Zustand + Tanstack Query for data fetching
- **Styling**: Tailwind CSS + shadcn/ui

### Backend (Express.js)
- **REST API**: Order management, asset data
- **WebSocket Server**: Real-time order book updates
- **Services**:
  - Order matching engine (simplified)
  - Market data generator
  - Trade executor

### Directory structure
/
├── my-app/ (Next.js)
│   ├── src/app/ (Pages)
│   ├── src/components/ (UI/TradeForm/OrderBook)
│   └── src/hooks/ (useWebSocket)
├── shared/
└── backend/src/
    ├─ services/
    │  ├── MarketDataService.ts # Mock generator for ALL assets
    │  └── OrderService.ts # Order execution
    ├─ store/
    │  ├── AssetStore.ts # Asset metadata
    │  ├── OrderBookStore.ts # PER-ASSET order books
    │  └── TradeStore.ts # Executed trades
    └─ models/
       ├── Asset.ts # Asset interface
       ├── Order.ts # Order interface
       └── OrderBook.ts # OrderBook interface

### The Matching Engine (Backend Logic)

    Mock Generator: Every 500ms, the server adds 1-3 random Limit Orders to the book within a ±5% range of the lastPrice.

    Market Order Logic:

        Buy: Sort Asks by price. Iterate until order.quantity is satisfied.

        Sell: Sort Bids by price (highest first). Iterate until filled.

    Cost Calculation: For a Market Buy of quantity Q:
    TotalCost=i=0∑n​(Pricei​×Quantityi​)

### Data Flow
1. Client connects via WebSocket (socket.io) for order book updates
2. REST API handles order placement
3. Mock market data generator creates random bids/asks
4. Orders matched in simplified FIFO engine

### Mock Data Sources
- Internal mock generator for bids/asks
- Static asset metadata
- Simulated price movement based on order flow