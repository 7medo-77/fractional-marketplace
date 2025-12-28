# Fractional Marketplace

Monorepo for a real-time fractional asset trading demo.

- **Frontend**: Next.js (App Router) + React + TypeScript + Tailwind + shadcn/ui + Zustand + Socket.io client
- **Backend**: Express + TypeScript + Socket.io server (mock market data + order matching)

---

## Run the project (Quickstart)

### Prerequisites
- Node.js (use whatever version matches your local setup; `npm` is assumed)
- Ports available:
  - Frontend: `http://localhost:3000`
  - Backend/API + Socket.io: `http://localhost:3001`

### 1) Start the backend (API + Socket.io)
```sh
cd backend
npm install
npm run dev
```

Backend listens on **http://localhost:3001** and the Socket.io server is on the same origin.

Backend env example: [backend/.env](backend/.env)
- `PORT=3001`
- `FRONTEND_URL=http://localhost:3000`

### 2) Start the frontend (Next.js app)
```sh
cd my-app
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**.

Frontend env example: [my-app/.env](my-app/.env)
- `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`
- `NEXT_PUBLIC_WS_URL=http://localhost:3001`

---

## Frontend (my-app/) — overview (primary)

### What the frontend provides
- Assets list with **real-time price updates**
- Asset detail page with:
  - Live charts (price history / depth)
  - Live order book
  - Trade interface (market / limit)
- Global UX utilities:
  - Toast notifications (Sonner)
  - Stable client user identity (localStorage, 24h expiry)

### Key routes (App Router)
- `/` — landing page
- `/assets` — assets list (server-fetched initial data + realtime updates)
- `/assets/[assetId]` — asset detail (charts, order book, trading)
- `/history` — user order history

### Realtime architecture (Socket.io + Zustand)
The frontend uses a singleton socket connection + global store for connection state, subscriptions, and notifications.

- Root layout mounts global bridges in: [my-app/src/app/layout.tsx](my-app/src/app/layout.tsx)
  - `SocketNotificationsBridge` for toast notifications
  - `UserIdInitializer` for stable user identity

- Shared UI that consumes socket connection state:
  - Footer (status UI): [my-app/src/components/shared/footer.tsx](my-app/src/components/shared/footer.tsx)

### Frontend directory structure (high-level)
```
my-app/
  src/
    app/                 # Next.js routes (App Router)
    components/          # UI + feature components
    hooks/               # Client hooks (socket/data transforms)
    lib/                 # Client utilities (api, socket, helpers)
    stores/              # Zustand stores (socket + realtime state)
    types.ts             # Shared TS types (frontend)
```

### API layer (frontend)
The frontend isolates REST calls into a typed API layer:
- API helpers: [my-app/src/lib/api.ts](my-app/src/lib/api.ts)
- URL + error utilities: [my-app/src/lib/utils/api-utils.ts](my-app/src/lib/utils/api-utils.ts)

Example: client-side order book fetch:
- `getOrderBookClient(assetId)` in [`getOrderBookClient`](my-app/src/lib/api.ts)

### User identity (client-side)
A stable `userId` is stored in `localStorage` and refreshed every 24h:
- Utility: [my-app/src/lib/utils/user-id.ts](my-app/src/lib/utils/user-id.ts)

---

## Backend (backend/) — brief

- Express REST API mounted under `/api/v1`
- Socket.io server emits market/order events
- Market data generator starts on boot:
  - Server bootstrap: [backend/src/server.ts](backend/src/server.ts)
  - Order logic: [backend/src/services/OrderService.ts](backend/src/services/OrderService.ts)

---

## Common scripts

### Frontend
```sh
cd my-app
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```

### Backend
```sh
cd backend
npm run dev
npm run build
npm run start
```