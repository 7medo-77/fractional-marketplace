/**
 * API Layer for Fractional Marketplace
 *
 * Provides type-safe functions for both:
 * - Server Components (with ISR)
 * - Client Components (with real-time updates)
 *
 * Following clean code principles:
 * - Single Responsibility (each function does one thing)
 * - Type Safety (no `any` types)
 * - Error Handling (proper error propagation)
 */

import type {
  Asset,
  OrderBook,
  Order,
  PlaceLimitOrderRequest,
  PlaceMarketOrderRequest,
  PlaceMarketOrderResponse,
} from '@/types';
import {
  buildApiUrl,
  handleApiResponse,
  serverFetchOptions,
  clientFetchOptions,
} from '@/lib/api-utils';

// ========================================
// SERVER-SIDE API FUNCTIONS (for Server Components)
// ========================================

/**
 * Fetch all assets (Server Component - with ISR)
 * Revalidates every 60 seconds
 */
export async function getAssets(): Promise<Asset[]> {
  const url = buildApiUrl('/assets');

  const response = await fetch(url, serverFetchOptions);
  return handleApiResponse<Asset[]>(response, '/assets');
}

/**
 * Fetch a single asset by ID (Server Component - with ISR)
 * Revalidates every 60 seconds
 */
export async function getAssetById(assetId: string): Promise<Asset> {
  const url = buildApiUrl(`/assets/${assetId}`);

  const response = await fetch(url, serverFetchOptions);
  return handleApiResponse<Asset>(response, `/assets/${assetId}`);
}

/**
 * Fetch order book for an asset (Server Component - with ISR)
 * Used for initial page load
 */
export async function getOrderBook(assetId: string): Promise<OrderBook> {
  const url = buildApiUrl(`/orders/book/${assetId}`);

  const response = await fetch(url, serverFetchOptions);
  return handleApiResponse<OrderBook>(response, `/orders/book/${assetId}`);
}

// ========================================
// CLIENT-SIDE API FUNCTIONS (for Client Components)
// ========================================

/**
 * Fetch all assets (Client Component)
 * Use this when you need fresh data on the client side
 */
export async function getAssetsClient(): Promise<Asset[]> {
  const url = buildApiUrl('/assets');

  const response = await fetch(url, {
    ...clientFetchOptions,
    cache: 'no-store', // Always fetch fresh data
  });

  return handleApiResponse<Asset[]>(response, '/assets');
}

/**
 * Fetch a single asset by ID (Client Component)
 */
export async function getAssetByIdClient(assetId: string): Promise<Asset> {
  const url = buildApiUrl(`/assets/${assetId}`);

  const response = await fetch(url, {
    ...clientFetchOptions,
    cache: 'no-store',
  });

  return handleApiResponse<Asset>(response, `/assets/${assetId}`);
}

/**
 * Place a limit order (Client Component only)
 */
export async function placeLimitOrder(
  params: PlaceLimitOrderRequest
): Promise<Order> {
  const url = buildApiUrl('/orders/limit');

  const response = await fetch(url, {
    ...clientFetchOptions,
    method: 'POST',
    body: JSON.stringify(params),
  });

  return handleApiResponse<Order>(response, '/orders/limit');
}

/**
 * Place a market order (Client Component only)
 */
export async function placeMarketOrder(
  params: PlaceMarketOrderRequest
): Promise<PlaceMarketOrderResponse> {
  const url = buildApiUrl('/orders/market');

  const response = await fetch(url, {
    ...clientFetchOptions,
    method: 'POST',
    body: JSON.stringify(params),
  });

  return handleApiResponse<PlaceMarketOrderResponse>(
    response,
    '/orders/market'
  );
}

/**
 * Fetch order book (Client Component)
 * Use this when you need a fresh snapshot on the client
 * Note: For real-time updates, use WebSocket instead
 */
export async function getOrderBookClient(assetId: string): Promise<OrderBook> {
  const url = buildApiUrl(`/orders/book/${assetId}`);

  const response = await fetch(url, {
    ...clientFetchOptions,
    cache: 'no-store',
  });

  return handleApiResponse<OrderBook>(response, `/orders/book/${assetId}`);
}