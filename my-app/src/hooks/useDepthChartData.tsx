'use client';

import { useEffect, useRef, useState } from 'react';
import type { OrderBookEntry } from '@/types';
import type { DepthChartPoint } from '@/lib/utils/chart-utils';
import { prepareDepthChartData } from '@/lib/utils/chart-utils';
import { getDepthChartWorker } from '@/lib/workers/depthChartWorkerClient';

export function useDepthChartData(
  bids: OrderBookEntry[],
  asks: OrderBookEntry[],
  currentPrice: number
) {
  const [data, setData] = useState<DepthChartPoint[]>([]);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (bids.length === 0 && asks.length === 0) {
      setData([]);
      return;
    }

    const requestId = ++requestIdRef.current;

    (async () => {
      try {
        const api = getDepthChartWorker();
        const result = await api.prepareDepthChartData(bids, asks, currentPrice);

        // Ignore stale async results
        if (requestIdRef.current === requestId) setData(result);
      } catch {
        // Fallback to main thread if worker fails for any reason
        const result = prepareDepthChartData(bids, asks, currentPrice);
        if (requestIdRef.current === requestId) setData(result);
      }
    })();
  }, [bids, asks, currentPrice]);

  return data;
}