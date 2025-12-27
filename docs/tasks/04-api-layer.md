# Task 04 — API Layer Setup (lib/api.ts)

Implement:
- Base API URL from `NEXT_PUBLIC_API_URL`.
- Server-side fetch helpers for Server Components (with `next: { revalidate: 60 }`).
- Client-side fetch helpers for Client Components.
- Type-safe responses and error handling.

Example: `getAssets(): Promise<Asset[]>` using `fetch(`${API_BASE_URL}/assets`)`.