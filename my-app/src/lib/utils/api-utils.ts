/**
 * API utility functions and configuration
 * Following Single Responsibility Principle
 */

import { ApiError } from '@/types';

/**
 * Get the API base URL from environment variables
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
}

/**
 * Build full API endpoint URL
 */
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

/**
 * Handle API errors with proper typing
 */
export async function handleApiResponse<T>(
  response: Response,
  endpoint: string
): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage: string;

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorJson.message || 'Unknown error';
    } catch {
      errorMessage = errorText || `HTTP ${response.status} error`;
    }

    throw new ApiError(errorMessage, response.status, endpoint);
  }

  return response.json() as Promise<T>;
}

/**
 * Default fetch options for server-side requests (ISR)
 */
export const serverFetchOptions: RequestInit = {
  next: { revalidate: 60 }, // ISR: Revalidate every 60 seconds
};

/**
 * Default fetch options for client-side requests
 */
export const clientFetchOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};