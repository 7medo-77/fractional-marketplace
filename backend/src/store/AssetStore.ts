import { Asset } from '../models/Asset';

class AssetStore {
  private assets: Map<string, Asset> = new Map();

  constructor() {
    this.initializeMockAssets();
  }

  private initializeMockAssets() {
    const mockAssets: Asset[] = [
      {
        id: 'asset_001',
        name: '1965 Ferrari 275 GTB',
        description: 'Vintage sports car in pristine condition',
        category: 'vehicles',
        totalShares: 1000,
        availableShares: 450,
        currentPrice: 4850,
        priceHistory: [{ price: 4850, timestamp: new Date().toISOString() }],
      },
      {
        id: 'asset_002',
        name: 'Manhattan Penthouse',
        description: 'Luxury penthouse in downtown Manhattan',
        category: 'real-estate',
        totalShares: 5000,
        availableShares: 2300,
        currentPrice: 12000,
        priceHistory: [{ price: 12000, timestamp: new Date().toISOString() }],
      },
      {
        id: 'asset_003',
        name: 'Picasso Original Painting',
        description: 'Authentic Picasso painting from 1932',
        category: 'collectibles',
        totalShares: 2000,
        availableShares: 800,
        currentPrice: 25000,
        priceHistory: [{ price: 25000, timestamp: new Date().toISOString() }],
      },
      {
        id: 'asset_004',
        name: 'Rolex Submariner Watch',
        description: 'Classic Rolex watch with diamond bezel',
        category: 'collectibles',
        totalShares: 1500,
        availableShares: 600,
        currentPrice: 7500,
        priceHistory: [{ price: 7500, timestamp: new Date().toISOString() }],
      },
    ];

    mockAssets.forEach((asset) => this.assets.set(asset.id, asset));
  }

  getAsset(id: string): Asset | undefined {
    return this.assets.get(id);
  }

  getAllAssets(): Asset[] {
    return Array.from(this.assets.values());
  }

  updateAssetPrice(id: string, price: number) {
    const asset = this.assets.get(id);
    if (asset) {
      asset.currentPrice = price;
      asset.priceHistory.push({ price, timestamp: new Date().toISOString() });
      // Keep only last 100 price points
      if (asset.priceHistory.length > 100) {
        asset.priceHistory = asset.priceHistory.slice(-100);
      }
    }
  }

  updateAvailableShares(id: string, shares: number) {
    const asset = this.assets.get(id);
    if (asset) {
      asset.availableShares = shares;
    }
  }
}

export default new AssetStore();