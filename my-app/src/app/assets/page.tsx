import { getAssets } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Assets Page - Server Component
 * Fetches asset data server-side with ISR (revalidates every 60s)
 */
export default async function AssetsPage() {
  const assets = await getAssets();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Available Assets</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and trade fractional ownership of high-value assets
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <Card key={asset.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl">{asset.name}</CardTitle>
                <Badge variant="outline">{asset.category}</Badge>
              </div>
              <CardDescription>{asset.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Price:</span>
                  <span className="font-semibold">
                    ${asset.currentPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Available:</span>
                  <span>
                    {asset.availableShares} / {asset.totalShares} shares
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}