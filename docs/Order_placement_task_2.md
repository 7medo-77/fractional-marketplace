## Agent Prompt: Implement Trading Interface + Orders/History Flow (Frontend + Backend)

### Context
This repo is **fractional-marketplace** with:
- Frontend: Next.js App Router under src
- Backend: Express + Socket.io under src
- Existing Socket.io event contract: socketEvents.ts and backend mirror socketEvents.ts
- Asset detail page server component: [`my-app/src/app/assets/[assetId]/page.tsx`](my-app/src/app/assets/[assetId]/page.tsx)
- Backend WebSocket handler: WebSocketHandler.ts
- Backend REST controller: OrderController.ts
- Backend services: OrderService.ts, Market data generator: MarketDataService.ts
- Frontend has an Orders History route: page.tsx (exists; implement wiring)
- Clean code guidance: clean-code.md (SRP, feature folders, split hooks/utils/types/constants)

### Goal
- Implement backend persistence in an **in-memory Order store/service** and a REST endpoint to fetch orders by `userId`.
- Update `/history` page to display the user’s orders.
- **Market orders** (filled immediately server-side)
- **Limit orders** (stored as `open`, then occasionally filled by `MarketDataService` tick with **0.1% probability**)
---

## Deliverables

### B) Backend: Orders Storage + Socket Events + Limit Fill Simulation
1. **Implement in-memory Order persistence**
   - Create an `OrderStore` (if none exists) under `backend/src/store/OrderStore.ts`:
     - `add(order)`
     - `update(orderId, partial)`
     - `getByUser(userId)`
     - `getOpenByUserAndAsset(userId, assetId)`
     - `getById(orderId)`
   - Ensure it never mixes assets incorrectly.

2. **Update OrderService to persist**
   - In OrderService.ts:
     - `placeLimitOrder` should create order with `status: 'open'`, save to store, return order
     - `placeMarketOrder` should create order with `status: 'filled'`, save to store, return `{ order, totalCost? }`
   - Optionally create Trade object for market order; keep it minimal but consistent with Trade.ts.

3. **Socket handlers**
   - Ensure backend socket emits `SERVER_EVENTS.ORDER_CONFIRMED` for both limit + market (already present in WebSocketHandler.ts; confirm payload matches frontend types).
   - If adding new events, update **both**:
     - socketEvents.ts
     - socketEvents.ts

4. **Limit order fill simulation in MarketDataService**
   - In MarketDataService.ts:
     - On each 500ms tick, for each asset:
       - Find open orders for users (at minimum: “all open orders”, later: per-user)
       - For each user, sort by `createdAt` ascending
       - With **0.1% chance** per tick, pick one eligible open limit order and mark it `filled` (and set `filledAt`)
       - Emit `SERVER_EVENTS.ORDER_CONFIRMED` to the relevant client(s)
         - If you don’t have per-user rooms yet, emit to the asset room for now, but include `userId` in payload so frontend can filter.
     - (Optional) also emit `SERVER_EVENTS.TRADE_EXECUTED` when a limit order is filled, consistent with the Trade model.

> Important: if you add `userId` to socket payloads, update the TS payload interfaces in both frontend and backend socketEvents files.

---

### C) Backend: REST Endpoint for User Order History
1. Add an endpoint in OrderController.ts:
   - `GET /api/v1/orders/user/:userId`
   - Returns all orders for that user (most recent first)
   - Add validation and 404/200 behaviors as appropriate.

---

## Acceptance Criteria
- Market orders: server immediately returns filled order; frontend shows toast based on ACK and/or `order_confirmed`.
- Limit orders: stored as open; occasionally gets filled by MarketDataService; frontend shows toast on fill.
- Socket event contracts remain consistent between frontend and backend socketEvents.ts.

---

## Implementation Notes / Guardrails
- Follow clean-code.md: keep components presentational, logic in hooks, utilities isolated.
- Update types in types.ts only if necessary; prefer using existing `Order`/`Trade` models.
- Do not introduce breaking changes to existing asset list real-time updates.
- Ensure server emits timestamps as ISO strings (consistent with current code).

---

## Suggested Work Plan
2. Implement backend OrderStore + update OrderService to persist
3. Add `GET /orders/user/:userId`
5. Add MarketDataService limit-fill simulation + emit `order_confirmed`
7. Manual test flows:
   - Place market buy
   - Place limit buy; wait for fill