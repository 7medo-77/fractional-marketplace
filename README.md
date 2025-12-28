# Fractional Marketplace

Monorepo for a real-time fractional asset trading demo.

- **Frontend**: Next.js (App Router) + React + TypeScript + Tailwind + shadcn/ui + Zustand + Socket.io client
- **Backend**: Express + TypeScript + Socket.io server (mock market data + order matching)

---

## Start the project

### 1) Backend (API + Socket server)
```sh
cd backend
npm install
npm run dev
```

By default the backend listens on **http://localhost:3001** and the Socket.io server is on the same origin.

### 2) Frontend (Next.js app)
```sh
cd my-app
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**.

### Environment variables

Backend: .env (example keys: `PORT`, `FRONTEND_URL`)

Frontend: .env (expected keys)
- `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`
- `NEXT_PUBLIC_WS_URL=http://localhost:3001`

---

## Frontend (my-app/) — overview

### Tech stack
- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Zustand** for client state (socket + realtime state)
- **Socket.io client** for realtime order book / prices / notifications
- **Recharts** for charts (price history + depth)

### Directory structure (high-level)
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

### Routing (App Router)
- layout.tsx
  Root layout (Header/Footer/Toaster) and global bridges:
  - `SocketNotificationsBridge` for toast notifications
  - `UserIdInitializer` for stable user identity

- page.tsx
  Server Component page that fetches assets via the API and renders client components for live updates.

- page.tsx
  Asset detail page that fetches initial asset data server-side and mounts realtime UI (charts, order book, trade interface).

### Realtime architecture (Socket.io + Zustand)
- Socket singleton utilities live in:
  - `initializeSocket` in socket.ts

- Global socket state (connection, listeners, subscriptions, notifications) lives in:
  - `useSocketStore` in socketStore.tsx

- Asset detail pages use a ref-counted subscription hook:
  - `useSmartSocket` in useSmartSocket.tsx
  This retains/releases an asset subscription on mount/unmount so multiple widgets on the same page can share one subscription.

### UI components
- `src/components/ui/` — shadcn primitives (Card, Tabs, Table, Input, etc.)
- `src/components/asset-detail/` — asset detail widgets:
  - Charts, order book panel, trade interface wrapper, etc.

### Linting / formatting
- ESLint is configured in:
  - eslint.config.mjs (Next.js core-web-vitals + TypeScript presets)

---

## Backend (backend/) — overview

- Express REST API mounted under `/api/v1`
- Socket.io server for realtime updates (market data + order updates)
- Market data generator runs on startup (see server.ts)

Run backend checks:
```sh
cd backend
npm run build
npm test
```

---

## Common scripts

Frontend:
```sh
cd my-app
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```

Backend:
```sh
cd backend
npm run dev
npm run build
npm run start
```