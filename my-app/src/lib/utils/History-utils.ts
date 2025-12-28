/**
 * History Page Utility Functions
 */

import type { Order } from '@/types';
import type { OrderStatusConfig } from '../../components/history/History.types';

export const ORDER_STATUS_CONFIG: Record<Order['status'], OrderStatusConfig> = {
  open: { label: 'Open', variant: 'secondary' },
  filled: { label: 'Filled', variant: 'default' },
  partial: { label: 'Partial', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export function getOrderTypeLabel(order: Order): string {
  const side = order.type === 'bid' ? 'Buy' : 'Sell';
  const type = order.orderType === 'market' ? 'Market' : 'Limit';
  return `${side} ${type}`;
}

export function formatOrderDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}