import { getAssets } from '@/lib/api';
import { AssetCardList } from '@/components/assets/AssetCardList';
import { AssetPageHeader } from '@/components/assets/AssetPageHeader';

/**
 * Assets Page - Server Component
 * Fetches initial asset data server-side with ISR (revalidates every 60s)
 * Client components handle real-time updates via WebSocket
 */
export default async function AssetsPage() {
  const initialAssets = await getAssets();

  return (
    <div>
      <AssetPageHeader />
      {/* Client Component that receives server-side data and subscribes to WebSocket */}
      <AssetCardList initialAssets={initialAssets} />
    </div>
  );
}