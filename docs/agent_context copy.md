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
1) Efficient order book broadcasting (avoid emitting inside per-asset loops unnecessarily).
2) New socket “endpoints” (events) for:
   - live price + price history per asset
   - order book snapshot per asset (for `/assets/[assetId]`)
3) Live pricing stream (ticker-style) driven by price drift in `MarketDataService`.
4) POST-like Socket.io endpoints for placing **limit** and **market** orders with real-time acknowledgement and follow-up events.

Also answer/decide: **Can we consolidate all socket.io endpoints in one place**, given that `MarketDataService` must update and emit periodically?

---

## Step-by-step Tasks (execute in order)

### Step 4 — Make orderbook_update more efficient (per agent_context)
Current behavior emits within the asset loop. Update it to reduce unnecessary emission overhead:

1. In `rebuildAndBroadcastOrderBooks`, still compute and update `OrderBookStore.updateOrderBook` per asset.
2. After the loop completes, emit updates **by reading from `OrderBookStore`**:
   - either emit `orderbook_update` per asset room (`asset:${assetId}`) from stored order books
   - or emit a batch event `orderbooks_snapshot` to `assets:all` if you want a landing-page depth overview

Minimum required:
- **Don’t emit inside the computation loop** if it can be avoided.
- Keep payload compatible with api_spec.md for `orderbook_update`.

**Deliverable:** Updated `rebuildAndBroadcastOrderBooks` that:
- updates the store first
- emits after the loop, ideally via room-based emission

---

### Step 5 — Implement POST-like order placement via Socket.io (Limit + Market)
Add two client→server endpoints using ack callbacks (like POST semantics):

#### 5A) `place_limit_order`
- Input: `{ assetId, type: 'buy'|'sell', quantity, price, userId }`
- Server calls `OrderService.placeLimitOrder`
- Ack response: `{ ok: true, order }` or `{ ok: false, error }`
- Emit follow-up event to client room / asset room:
  - `order_confirmed` to the requesting socket (or user room if you add user rooms)
  - `orderbook_update` should reflect the new order (either add to book or let next tick pick it up)

#### 5B) `place_market_order`
- Input: `{ assetId, type: 'buy'|'sell', quantity, userId }`
- Server calls `OrderService.placeMarketOrder`
- Ack response: `{ ok: true, order, totalCost? }` or `{ ok: false, error }`
- Emit follow-up events:
  - `order_confirmed`
  - `trade_executed` if you implement matching now; otherwise stub it but keep the event contract

**Important constraints:**
- Market orders should **not** appear in mock generator books.
- Validation: reject negative/zero quantity, missing fields, missing price for limit.
- Keep behavior consistent with api_spec.md.

**Deliverable:** Updated `WebSocketHandler` to listen for these events and call [`OrderService`](backend/src/services/OrderService.ts). Minimal stub is acceptable but must return ack and emit `order_confirmed`.

---

### Step 6 — Decide and document consolidation strategy (answer the question explicitly)
Provide a clear decision:

- **Yes:** consolidate all *listeners* in `WebSocketHandler`, keep emissions in services.
- Explain why emissions from `MarketDataService` should remain there (timer-driven, data generator), but event naming/payload should be centralized in one “contract” (constants/types) if desired.

Optionally add:
- a shared file like `backend/src/handlers/socketEvents.ts` to store event name constants and payload types.

**Deliverable:** A short explanation + (optional) event constants/types file.

---

## Acceptance Criteria
- Landing page can subscribe once and receive live prices (ticker updates).
- Asset detail page can request:
  - `get_asset_price` (includes `priceHistory`)
  - `get_orderbook`
  - and receive live `orderbook_update` + live price event
- Order placement via Socket.io works with ack callback + emits `order_confirmed`.
- Emission strategy is improved: avoids emitting per asset inside the compute loop where feasible.
- Rooms are used appropriately (`asset:${assetId}`, `assets:all`) to prevent mixing assets and reduce broadcast noise.

---