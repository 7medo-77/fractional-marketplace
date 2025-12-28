'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useSocketStore } from '@/stores/socketStore';
import { getOrCreateUserId } from '@/lib/utils/user-id';

export function SocketNotificationsBridge() {
  const connect = useSocketStore((s) => s.connect);
  const setUserId = useSocketStore((s) => s.setUserId);
  const notifications = useSocketStore((s) => s.notifications);
  const clearNotifications = useSocketStore((s) => s.clearNotifications);

  // Ensure socket is initialized + listeners are attached early
  useEffect(() => {
    connect();
  }, [connect]);

  // Provide userId for filtering notification events
  useEffect(() => {
    const uid = getOrCreateUserId();
    setUserId(uid === 'ssr-placeholder' ? null : uid);
  }, [setUserId]);

  // Display notifications
  useEffect(() => {
    if (notifications.length === 0) return;

    for (const n of notifications) {
      if (n.kind === 'confirmed') {
        toast.success('Order confirmed', {
          description: `Order ${n.orderId.slice(0, 8)}...`,
        });
      } else {
        toast.success('Limit order filled', {
          description: `${n.side === 'buy' ? 'Buy' : 'Sell'} ${n.quantity} @ $${n.price.toFixed(2)}`,
          duration: 5000,
        });
      }
    }

    clearNotifications();
  }, [notifications, clearNotifications]);

  return null;
}