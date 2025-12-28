/**
 * Order History Table Component
 * Displays user's order history
 */

'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Order } from '@/types';
import { formatCurrency } from '@/lib/utils/utils';
import { ORDER_STATUS_CONFIG, getOrderTypeLabel, formatOrderDate } from '../../../lib/utils/History-utils';

interface OrderHistoryTableProps {
  orders: Order[];
}

export function OrderHistoryTable({ orders }: OrderHistoryTableProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No orders yet</p>
            <p className="mt-1 text-sm">
              Place your first order on an asset page to see it here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Filled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const statusConfig = ORDER_STATUS_CONFIG[order.status];
              const isBuy = order.type === 'bid';

              return (
                <TableRow key={order.id}>
                  <TableCell>
                    <span className={isBuy ? 'text-green-600' : 'text-red-600'}>
                      {getOrderTypeLabel(order)}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {order.assetId.slice(0, 12)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {order.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.price ? formatCurrency(order.price) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatOrderDate(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.filledAt ? formatOrderDate(order.filledAt) : '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}