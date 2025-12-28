/**
 * Order History Page
 * Displays the user's order history
 */

import { HistoryClient } from '@/components/history';

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Order History</h1>
        <p className="mt-2 text-muted-foreground">
          View your past and pending orders
        </p>
      </div>

      <HistoryClient />
    </div>
  );
}