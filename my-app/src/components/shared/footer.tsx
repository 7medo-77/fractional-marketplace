'use client';

import { Badge } from '@/components/ui/badge';

export function Footer() {
  // TODO: Replace with actual WebSocket connection status from store
  const isConnected = true;

  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto flex h-16 flex-col items-center justify-between px-4 py-3 sm:flex-row sm:px-6 lg:px-8">
        {/* Copyright */}
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Fractional Marketplace. All rights reserved.
        </div>

        {/* Status & Version */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Badge
              variant={isConnected ? 'default' : 'destructive'}
              className="text-xs"
            >
              {isConnected ? (
                <>
                  <span className="mr-1 h-2 w-2 rounded-full bg-green-500" />
                  Connected
                </>
              ) : (
                <>
                  <span className="mr-1 h-2 w-2 rounded-full bg-red-500" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>

          {/* Version */}
          <div className="hidden text-xs text-muted-foreground sm:block">
            v1.0.0
          </div>
        </div>
      </div>
    </footer>
  );
}