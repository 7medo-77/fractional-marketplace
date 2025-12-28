/**
 * Status Bar Component
 * Combines all status indicators
 */

'use client';

import { ConnectionStatus } from './ConnectionStatus';
import { LastUpdateTimestamp } from './LastUpdateTimestamp';
import { MarketStatus } from './MarketStatus';

export function StatusBar() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between rounded-lg border bg-card p-3">
      <div className=" flex items-between gap-4">
        <ConnectionStatus />
        <MarketStatus />
      </div>
      <LastUpdateTimestamp />
    </div>
  );
}