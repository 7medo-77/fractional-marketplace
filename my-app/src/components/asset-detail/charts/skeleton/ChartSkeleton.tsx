/**
 * Chart Loading Skeleton
 */

'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function ChartSkeleton() {
  return (
    <div className="h-[400px] w-full flex flex-col gap-4 p-4">
      {/* Y-axis labels skeleton */}
      <div className="flex justify-between">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
      </div>

      {/* Main chart area */}
      <div className="flex-1 relative">
        <Skeleton className="w-full h-full rounded-md" />

        {/* Grid overlay skeleton */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-full border-t border-muted"
              style={{ top: `${i * 20}%` }}
            />
          ))}
        </div>
      </div>

      {/* X-axis labels skeleton */}
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}