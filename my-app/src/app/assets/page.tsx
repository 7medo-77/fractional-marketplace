import { getAssets } from '@/lib/api';
import { AssetCardList } from '@/components/assets/AssetCardList';
import { AssetPageHeader } from '@/components/assets/AssetPageHeader';
import { StatusBar } from '@/components/shared/status-bar/StatusBar';

/**
 * Assets Page - Server Component
 * Fetches initial asset data server-side with ISR (revalidates every 60s)
 * Client components handle real-time updates via WebSocket
 */
export default async function AssetsPage() {
  const initialAssets = await getAssets();

  return (
    <div className="space-y-6">
      <AssetPageHeader />
      <StatusBar />
      <AssetCardList initialAssets={initialAssets} />
    </div>
  );
}