# Task 04 — API Layer Setup (lib/api.ts)

Implement:
- Base API URL from `NEXT_PUBLIC_API_URL`.
- Server-side fetch helpers for Server Components (with `next: { revalidate: 60 }`).
- Client-side fetch helpers for Client Components.
- Type-safe responses and error handling.


### TASK 4: API Layer Setup

File: lib/api.ts
- Create a clean API service layer:

    Base API configuration with error handling

    Server-side fetch functions for Server Components

    Client-side fetch functions for Client Components

    Type-safe API responses

    Example: `getAssets(): Promise<Asset[]>` using `fetch(`${API_BASE_URL}/assets`)`.

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