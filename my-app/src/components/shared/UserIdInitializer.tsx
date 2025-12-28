/**
 * User ID Initializer
 * Ensures userId is created when user first visits the app
 * This is a client component that runs once on mount
 */

'use client';

import { useEffect } from 'react';
import { getOrCreateUserId } from '@/lib/utils/user-id';

export function UserIdInitializer() {
  useEffect(() => {
    // Initialize userId on app load
    getOrCreateUserId();
  }, []);

  // This component renders nothing
  return null;
}