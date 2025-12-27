# Agent Context Guide

## Project: Fractional Marketplace

## Quick Links to Documentation
- [Architecture](./architecture.md)
- [Requirements](./PRD.md)
- [API Specification](./api-spec.md)
- [Data Schema](./schema.md)

## Tech Stack
- Backend: Express.js + TypeScript
- Frontend: Next.js 14 + App Router + TypeScript
- Real-time: WebSocket
- Styling: Tailwind CSS

## Key Constraints
- Update order book every 500ms with mock data
- Support limit and market orders
- Use in-memory storage for mock
- TypeScript strict mode


## Agent Prompt: Consolidate Socket.io Endpoints + Ticker + POST-like Order Placement

You are working in the `fractional-marketplace` repo with this backend structure:

- Socket setup: server.ts
- Socket handler: WebSocketHandler.ts
- Market generator + drift: MarketDataService.ts
- REST controller: OrderController.ts
- Stores: AssetStore.ts, OrderBookStore.ts
- Services: OrderService.ts
- WS format reference: api_spec.md
- Task notes: agent_context.md

### Goal
Implement a clean Socket.io API that supports:
1) New socket “endpoints” (events) for:
   - live price + price history per asset
   - order book snapshot per asset (for `/assets/[assetId]`)
2) Live pricing stream (ticker-style) driven by price drift in `MarketDataService`.

Also answer/decide: **Can we consolidate all socket.io endpoints in one place**, given that `MarketDataService` must update and emit periodically?

---

## Step-by-step Tasks (execute in order)

### Step 1 — Inventory current Socket.io events and align naming
1. List all existing socket events and where they are defined/emitted:
   - inbound events from clients in `WebSocketHandler.initialize`
   - outbound events emitted by `MarketDataService`
2. Ensure event names are consistent with api_spec.md where possible (`orderbook_update`, `order_confirmed`, `trade_executed`).

**Deliverable:** a short list/table of events and their payload formats.

---

### Step 2 — Consolidate incoming Socket.io endpoints in one place
**Requirement:** All *incoming* socket endpoints (listeners) should be registered centrally in `WebSocketHandler.initialize`.
**Decision:** Outgoing emissions can still occur in services (e.g., `MarketDataService`), but there should be a single, consistent “emit contract”.

Implement new listeners using Socket.io **ack callbacks** (request/response pattern).

Add these endpoints:

#### 2A) `get_asset_price` (request/response)
- Input: `{ assetId }`
- Response: `{ assetId, currentPrice, priceHistory }`
- Data source: `AssetStore.getAsset`

#### 2B) `get_orderbook` (request/response)
- Input: `{ assetId }`
- Response: order book snapshot from `OrderBookStore.getOrderBook`

#### 2C) Room subscription for landing page
- Add `subscribe_all_assets` event
  - joins room: `assets:all`
- Add `unsubscribe_all_assets` event
  - leaves room: `assets:all`

**Deliverable:** Updated `WebSocketHandler.initialize` with these listeners and basic validation/errors.

---

### Step 3 — Implement ticker-style live pricing stream from MarketDataService
When drift updates price by calling `AssetStore.updateAssetPrice`, also emit a lightweight pricing event.

Choose one approach and implement it cleanly:

#### Option A: `asset_price_update` (per asset)
Emit when each asset price changes:
- event name: `asset_price_update`
- payload: `{ event: 'asset_price_update', data: { assetId, currentPrice, timestamp } }`

Emit this to:
- room `asset:${assetId}` (asset detail page)
- AND room `assets:all` (landing page), if you implement `subscribe_all_assets`

#### Option B: `assets_price_snapshot` (batch snapshot)
Every 500ms (or every tick), emit **one** event containing all assets:
- event name: `assets_price_snapshot`
- payload: `{ event: 'assets_price_snapshot', data: { assets: [{ assetId, currentPrice }...], timestamp } }`

Emit this to room `assets:all` or globally.

**Deliverable:** Updated `MarketDataService` emitting one of the above formats.

---
