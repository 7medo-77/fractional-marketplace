/**
 * Order Book Loading Skeleton
 */

'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function OrderBookSkeleton() {
  return (
    <div className="h-[400px] overflow-auto p-4 space-y-2">
      {/* Header skeleton */}
      <div className="flex gap-4 mb-4">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>

      {/* Rows skeleton */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}

      {/* Spread row */}
      <div className="flex gap-4 mt-4 pt-4 border-t">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
  );
}