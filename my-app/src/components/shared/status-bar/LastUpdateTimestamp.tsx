/**
 * Last Update Timestamp Component
 * Shows when data was last updated
 */

'use client';

import { useEffect, useState } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import { formatDistanceToNow } from 'date-fns';

export function LastUpdateTimestamp() {
  const lastUpdateTime = useSocketStore((state) => state.lastUpdateTime);
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (!lastUpdateTime) return;

    const updateTimeAgo = () => {
      setTimeAgo(formatDistanceToNow(new Date(lastUpdateTime), { addSuffix: true }));
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [lastUpdateTime]);

  if (!lastUpdateTime) return null;

  return (
    <div className="text-xs text-muted-foreground">
      Updated {timeAgo}
    </div>
  );
}