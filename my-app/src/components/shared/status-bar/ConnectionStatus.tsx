/**
 * Connection Status Component
 * Displays Socket.io connection status
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { useSocketStore } from '@/stores/socketStore';

export function ConnectionStatus() {
  const isConnected = useSocketStore((state) => state.isConnected);

  return (
    <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-2">
      <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
      {isConnected ? 'Live' : 'Connecting...'}
    </Badge>
  );
}