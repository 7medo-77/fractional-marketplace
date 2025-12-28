/**
 * History Page Types
 */

import type { Order } from '@/types';

export interface OrderHistoryProps {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
}

export type OrderStatusVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface OrderStatusConfig {
  label: string;
  variant: OrderStatusVariant;
}