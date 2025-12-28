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
Build a professional **trade interface** on the asset detail page that allows placing:
- **Market orders** (filled immediately server-side)
- **Limit orders** (stored as `open`, then occasionally filled by `MarketDataService` tick with **0.1% probability**, which has been already done)

Also:
- Add a **userId** generated client-side once/day and stored in `localStorage`.
- Update `/history` page to display the user’s orders.
- use sonner toast to display toast message upon receiving events from the backend

---

## Deliverables

### A) Frontend: Trade Interface UI + Socket Flow
1. **Create Trade Interface component** and render it on the asset detail page layout.
   - Location suggestion (follow SRP):
     `my-app/src/components/asset-detail/TradeInterface/`
     - `TradeInterface.tsx` (UI)
     - `TradeInterface.hooks.ts` (logic + socket calls)
     - `TradeInterface.types.ts`
     - `TradeInterface.utils.ts`
     - `TradeInterface.constants.ts`
   - Mount it in [`my-app/src/app/assets/[assetId]/page.tsx`](my-app/src/app/assets/[assetId]/page.tsx) (left column or beneath `AssetInfo`).

2. **UI requirements (professional trading panel)**
   - Buy/Sell toggle
   - Order type tabs: Market / Limit
   - Quantity input (number)
   - Price input (number) only for Limit
   - Estimated total (quantity * price for Limit; market can show “—” or best-available estimate)
   - Primary CTA: “Place Order”
   - Disabled states + inline validation
   - Use existing shadcn/ui patterns already used in the app (Card, Tabs, Button, Input, etc.)

3. **UserId generation with 1-day expiry**
   - Create a utility `getOrCreateUserId()`:
     - Checks `localStorage` for `fm_user_id` and `fm_user_id_exp`
     - If missing/expired, generates UUID, stores both, exp = now + 24h
   - Place this logic where it runs when the user visits the landing page **and** ensure it exists when user places an order (defensive).
   - File suggestion: `my-app/src/lib/user-id.ts` or `my-app/src/lib/auth-mock.ts`

4. **Socket emit + toaster feedback**
   - Use socket.io client utilities in socket.ts.
   - Emit:
     - `CLIENT_EVENTS.PLACE_MARKET_ORDER`
     - `CLIENT_EVENTS.PLACE_LIMIT_ORDER`
     from socketEvents.ts
   - Payloads must include `{ assetId, type: 'buy'|'sell', quantity, userId }` and for limit: `price`.
   - Handle ACK callbacks from server (already used in backend handler).
   - Listen for:
     - `SERVER_EVENTS.ORDER_CONFIRMED` and show toaster
     - (later) `SERVER_EVENTS.TRADE_EXECUTED` if needed for additional UI
   - Ensure the interface is resilient if disconnected (show error toast / disable submit).

5. **Avoid duplicate subscriptions**
   - There are existing socket hooks (e.g., useSmartSocket.tsx, and possibly another variant). Consolidate or reuse one hook for the asset page (use the useSmartSocket.tsx hook. the rest will be removed later) so the trade interface doesn’t create a second independent socket subscription.
   - Minimum requirement: trade interface must not cause duplicate subscribe/unsubscribe loops.

---

> Important: if you add `userId` to socket payloads, update the TS payload interfaces in both frontend and backend socketEvents files.

---

### C) Frontend: /history page
1. Frontend: Update `/history` page
   - In page.tsx:
     - Read `userId` from localStorage in a client component (or render a client wrapper)
     - Fetch `GET /api/v1/orders/user/:userId`
     - Render a table/list: type, orderType, quantity, price, status, createdAt, filledAt
     - Add loading/empty/error states

---

## Acceptance Criteria
- Asset detail page shows a **trade panel** with Market/Limit, Buy/Sell, quantity/price fields, and a “Place Order” button.
- Market orders: server immediately returns filled order; frontend shows toast based on ACK and/or `order_confirmed`.
- Limit orders: stored as open; occasionally gets filled by MarketDataService; frontend shows toast on fill.
- A stable `userId` is created once and expires after 24h.
- `/history` shows the user’s orders via the new backend endpoint.
- Socket event contracts remain consistent between frontend and backend socketEvents.ts.

---

## Implementation Notes / Guardrails
- Follow clean-code.md: keep components presentational, logic in hooks, utilities isolated.
- Prefer adding small focused files over monolithic hooks.
- Update types in types.ts only if necessary; prefer using existing `Order`/`Trade` models.
- Do not introduce breaking changes to existing asset list real-time updates.
- Ensure server emits timestamps as ISO strings (consistent with current code).

---

## Suggested Work Plan
1. Add userId utility + ensure landing page initializes it
2. Build TradeInterface UI + hook that emits socket events
3. Implement `/history` UI
4. Manual test flows:
   - Place market buy/sell
   - Place limit buy/sell; wait for fill
   - Refresh page; verify userId persists; history shows orders