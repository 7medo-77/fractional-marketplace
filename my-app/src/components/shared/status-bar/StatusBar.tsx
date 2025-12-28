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
    <div className="flex flex-col md:flex-row justify-between gap-2 rounded-lg border bg-card p-2">
      <div className=" flex justify-between gap-4 ">
        <ConnectionStatus />
        <MarketStatus />
      </div>
      <LastUpdateTimestamp />
    </div>
  );
}