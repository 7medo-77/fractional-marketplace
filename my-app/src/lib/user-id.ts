/**
 * User ID Management Utility
 * Generates and manages a stable userId with 24-hour expiry
 *
 * Following Single Responsibility Principle:
 * - Only handles userId generation and persistence
 */

import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'fm_user_id';
const USER_ID_EXPIRY_KEY = 'fm_user_id_exp';
const EXPIRY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if we're running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Get or create a userId with 24-hour expiry
 * - Checks localStorage for existing userId
 * - If missing or expired, generates new UUID
 * - Stores with expiry timestamp
 */
export function getOrCreateUserId(): string {
  if (!isBrowser()) {
    // Return a placeholder for SSR - will be replaced on client
    return 'ssr-placeholder';
  }

  const storedUserId = localStorage.getItem(USER_ID_KEY);
  const storedExpiry = localStorage.getItem(USER_ID_EXPIRY_KEY);

  // Check if we have a valid, non-expired userId
  if (storedUserId && storedExpiry) {
    const expiryTime = parseInt(storedExpiry, 10);
    if (Date.now() < expiryTime) {
      return storedUserId;
    }
  }

  // Generate new userId with expiry
  const newUserId = uuidv4();
  const newExpiry = Date.now() + EXPIRY_DURATION_MS;

  localStorage.setItem(USER_ID_KEY, newUserId);
  localStorage.setItem(USER_ID_EXPIRY_KEY, newExpiry.toString());

  console.log('🆔 Generated new userId:', newUserId);

  return newUserId;
}

/**
 * Get existing userId without creating new one
 * Returns null if not found or expired
 */
export function getUserId(): string | null {
  if (!isBrowser()) {
    return null;
  }

  const storedUserId = localStorage.getItem(USER_ID_KEY);
  const storedExpiry = localStorage.getItem(USER_ID_EXPIRY_KEY);

  if (storedUserId && storedExpiry) {
    const expiryTime = parseInt(storedExpiry, 10);
    if (Date.now() < expiryTime) {
      return storedUserId;
    }
  }

  return null;
}

/**
 * Clear userId from storage
 */
export function clearUserId(): void {
  if (!isBrowser()) return;

  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_ID_EXPIRY_KEY);
}