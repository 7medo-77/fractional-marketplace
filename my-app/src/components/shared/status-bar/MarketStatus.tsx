/**
 * Market Status Component
 * Simulates market open/closed status
 */

'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

export function MarketStatus() {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // Simulate market hours: 9 AM - 4 PM EST
    const checkMarketStatus = () => {
      const now = new Date();
      const hour = now.getHours();
      // Simulate always open for demo purposes
      setIsOpen(true);
      // Uncomment for real market hours:
      // setIsOpen(hour >= 9 && hour < 16);
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <Badge variant={isOpen ? 'default' : 'secondary'}>
      {isOpen ? '🟢 Market Open' : '🔴 Market Closed'}
    </Badge>
  );
}