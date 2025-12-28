/**
 * Asset Card List Component
 * Manages list of assets with real-time updates
 * Client Component that initializes WebSocket connection
 */

'use client';

import { useState, useMemo } from 'react';
import { AssetCard } from './card/AssetCard';
import { useSocket } from '@/hooks/useSocket';
import type { Asset } from '@/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AssetCardListProps {
  initialAssets: Asset[];
}

export function AssetCardList({ initialAssets }: AssetCardListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const router = useRouter();

  // Initialize WebSocket connection
  const { isConnected } = useSocket();

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(initialAssets.map((asset) => asset.category));
    return Array.from(cats);
  }, [initialAssets]);

  const handleAssetClick = (assetId: string) => {
    // Handle asset click if needed
    router.push(`/assets/${assetId}`);
  }

  // Filter assets
  const filteredAssets = useMemo(() => {
    return initialAssets.filter((asset) => {
      const matchesSearch =
        searchQuery === '' ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === null || asset.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [initialAssets, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
          <div className="text-center">
            <p className="text-lg font-medium">No assets found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} onClick={() => handleAssetClick(asset.id)} />
          ))}
        </div>
      )}
    </div>
  );
}